define(["scripts/utils.js"], function(Utils) {
	var exports = {};

	var idiv = function (a, b) {
        return ~~(a / b);
    };
	// buffer tools
	var newBuffer = function(size, data) {
		var res = new Uint8Array(new ArrayBuffer(size));
		if (data) {
			for (var i = 0; i < size; i++) {
				res[i] = data[i];
			}
		}
		return res;
	};

	var subBuffer = function (array, offset) {
        var buf = array.buffer;
        var bufOffset = (buf.byteLength - array.length) + offset;
        return new Uint8Array(buf, bufOffset, buf.byteLength - bufOffset);
    };

	var cpyStrToBuffer = function (buffer, offset, str) {
        for (var i = 0; i < str.length; i++) {
            buffer[offset + i] = str.charCodeAt(i);
        }
    };

	var cpyDataToBuffer = function (buffer, offset, data) {
        for (var i = 0; i < data.length; i++) {
            buffer[offset + i] = data[i];
        }
    };

	var cmpStrToBuffer = function(buffer, offset, str) {
		for (var i = 0; i < str.length; i++) {
			if (buffer[offset+i] != str.charCodeAt(i)) return 1;
		}
		return 0;
	};

	// disk
	var FMT_AUTO   = 0;
	var FMT_IMG    = 1;
	var FMT_MGT    = 2;
	var FMT_TRD    = 3;
	var FMT_FDI    = 4;
	var FMT_SCL    = 5;
	var FMT_HOBETA = 6;
	var FMT_DSK    = 7;
	var FMT_CPCDSK = 8;
	var FMT_SF7000 = 9;

	function FDIDisk() {
		this.Format = 0;     /* Original disk format (FMT_*) byte */
		this.Sides = 0;      /* Sides per disk int  */
		this.Tracks = 0;     /* Tracks per side int  */
		this.Sectors = 0;    /* Sectors per track int  */
		this.SecSize = 0;    /* Bytes per sector int  */

		this.Data = undefined;      /* Disk data byte */
		this.DataSize = 0;   /* Disk data size int  */

		this.Header = new Uint8Array(6);  /* Current header, result of SeekFDI() byte */
		this.Verbose = 0;    /* 1: Print debugging messages byte */
	}

	var IMAGE_SIZE = function(Fmt) {
		return Formats[Fmt].Sides * Formats[Fmt].Tracks * Formats[Fmt].Sectors * Formats[Fmt].SecSize;
	};

	var FDI_SIDES = function(P) { return P[6] | (P[7]<<8);	};

	var FDI_TRACKS = function(P) { return P[4] | (P[5]<<8); };

	var FDI_DIR = function(P) { return subBuffer(P, (P[12] | (P[13]<<8)) + 14); };

	var FDI_DATA = function(P) { return subBuffer(P, (P[10] | (P[11]<<8))); };

	var FDI_INFO = function(P) { return subBuffer(P, (P[8] | (P[9]<<8))); };

	var FDI_SECTORS = function(T) { return T[6]; };

	var FDI_TRACK = function(P,T) { return subBuffer(FDI_DATA(P), T[0] | (T[1]<<8) | (T[2]<<16) | (T[3]<<24)); };

	var FDI_SECSIZE = function(S) { return SecSizes[ (S[3] <= 4) ? (S[3]) : (4) ]; };

	var FDI_SECTOR = function(P,T,S) { return subBuffer(FDI_TRACK(P,T), S[5] | (S[6]<<9)); };

	FDIDisk.prototype.DataFDI = function(D) {
		return subBuffer(D.Data, D.Data[10] | (D.Data[11]<<8));
	};

	function FmtStruct(Sides,Tracks,Sectors,SecSize) {
		this.Sides = Sides;
		this.Tracks = Tracks;
		this.Sectors = Sectors;
		this.SecSize = SecSize;
	}

	var Formats = [
		new FmtStruct(2,80,16,256), /* Dummy format */
				new FmtStruct(2,80,10,512), /* FMT_IMG can be 256 */
				new FmtStruct(2,80,10,512), /* FMT_MGT can be 256 */
				new FmtStruct(2,80,16,256), /* FMT_TRD */
				new FmtStruct(2,80,10,512), /* FMT_FDI */
				new FmtStruct(2,80,16,256), /* FMT_SCL */
				new FmtStruct(2,80,16,256), /* FMT_HOBETA */
				new FmtStruct(2,80,9,512),  /* FMT_DSK */
				new FmtStruct(2,80,9,512),  /* FMT_CPCDSK */
				new FmtStruct(1,40,16,256)  /* FMT_SF7000 */
					];

	var SecSizes = [128,256,512,1024,4096,0];

	var FDIDiskLabel = "Disk image created by EMULib (C)Marat Fayzullin";

	var TRDDiskInfo = [
		0x01,0x16,0x00,0xF0,0x09,0x10,0x00,0x00,
		0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,
		0x20,0x00,0x00,0x64,0x69,0x73,0x6B,0x6E,
		0x61,0x6D,0x65,0x00,0x00,0x00,0x46,0x55
			];

	/** InitFDI() ************************************************/
	/** Clear all data structure fields.                        **/
	/*************************************************************/
	FDIDisk.prototype.InitFDI = function(D)
	{
		D.Format   = 0;
		D.Data     = 0;
		D.DataSize = 0;
		D.Sides    = 0;
		D.Tracks   = 0;
		D.Sectors  = 0;
		D.SecSize  = 0;
	};

	/** EjectFDI() ***********************************************/
	/** Eject disk image. Free all allocated memory.            **/
	/*************************************************************/
	FDIDisk.prototype.EjectFDI = function(D)
	{
		if (D.Data) D.Data = undefined;
		this.InitFDI(D);
	};

	/** NewFDI() *************************************************/
	/** Allocate memory and create new .FDI disk image of given **/
	/** dimensions. Returns disk data pointer on success, 0 on  **/
	/** failure.                                                **/
	/*************************************************************/
	FDIDisk.prototype.NewFDI = function(D, Sides, Tracks, Sectors, SecSize)
	{
		var P,DDir;
		var I,J,K,L,N;

		/* Find sector size code */
		for (L=0; SecSizes[L] && (SecSizes[L] != SecSize); L++);
		if (!SecSizes[L])
			return(0);

		/* Allocate memory */
		K = Sides * Tracks * Sectors * SecSize + FDIDiskLabel.length;
		I = Sides * Tracks * (Sectors+1) * 7 + 14;
		P = newBuffer(I+K);

		/* Eject previous disk image */
		this.EjectFDI(D);

		/* Set disk dimensions according to format */
		D.Format   = FMT_FDI;
		D.Data     = P;
		D.DataSize = I+K;
		D.Sides    = Sides;
		D.Tracks   = Tracks;
		D.Sectors  = Sectors;
		D.SecSize  = SecSize;

		/* .FDI magic number */
		cpyStrToBuffer(P, 0, "FDI");
		/* Disk description */
		cpyStrToBuffer(P, I, FDIDiskLabel);
		/* Write protection (1=ON) */
		P[3]  = 0;
		P[4]  = Tracks & 0xFF;
		P[5]  = Tracks >> 8;
		P[6]  = Sides & 0xFF;
		P[7]  = Sides >> 8;
		/* Disk description offset */
		P[8]  = I & 0xFF;
		P[9]  = I >> 8;
		I    += FDIDiskLabel.length;
		/* Sector data offset */
		P[10] = I & 0xFF;
		P[11] = I >> 8;
		/* Track directory offset */
		P[12] = 0;
		P[13] = 0;

		/* Create track directory */
		for(J=K=0,DDir=subBuffer(P,14);J<Sides*Tracks;J++,K+=Sectors*SecSize)
		{
			/* Create track entry */
			DDir[0] = K & 0xFF;
			DDir[1] = (K >> 8) & 0xFF;
			DDir[2] = (K >> 16) & 0xFF;
			DDir[3] = (K >> 24) & 0xFF;
			/* Reserved bytes */
			DDir[4] = 0;
			DDir[5] = 0;
			DDir[6] = Sectors;
			/* For all sectors on a track... */
			for(I=N=0,DDir=subBuffer(DDir,7);I<Sectors;++I,DDir=subBuffer(DDir,7),N+=SecSize)
			{
				/* Create sector entry */
				DDir[0] = (J / Sides) & 0xFF;
				DDir[1] = J % Sides;
				DDir[2] = I + 1;
				DDir[3] = L;
				/* CRC marks and "deleted" bit (D00CCCCC) */
				DDir[4] = (1 << L);
				DDir[5] = N & 0xFF;
				DDir[6] = N >> 8;
			}
		}

		/* Done */
		return FDI_DATA(P);
	};

	/** LoadFDI() ************************************************/
	/** Load a disk image from a given file, in a given format  **/
	/** (see FMT_* #defines). Guess format from the file name   **/
	/** when Format=FMT_AUTO. Returns format ID on success or   **/
	/** 0 on failure. When FileName=0, ejects the disk freeing  **/
	/** memory and returns 0.                                   **/
	/*************************************************************/
	FDIDisk.prototype.LoadFDI = function(D, FileName, Format, Data) {
		var P,DDir;
		var T;
		var J,I,K,L,N;

		/* If just ejecting a disk, drop out */
		if (!FileName) {
			this.EjectFDI(D);
			return 0;
		}

		/* If requested automatic format recognition... */
		if (!Format)
		{
			switch (FileName.slice(-4).toUpperCase()) {
				case ".FDI":
					Format = FMT_FDI;
					break;
				case ".DSK":
					Format = FMT_DSK;
					break;
				default:
					Format = 0;
					break;
			}

			/* Try loading by extension */
			if (Format && (J = this.LoadFDI(D, FileName, Format, Data)))
				return J;

			/* Try loading by magic number */
			if ((Format != FMT_FDI) && this.LoadFDI(D, FileName, FMT_FDI, Data)) return FMT_FDI;
			if ((Format != FMT_DSK) && this.LoadFDI(D, FileName, FMT_DSK, Data)) return FMT_DSK;

			/* Everything failed */
			return 0;
		}

		/* Open file and find its size */
		J = Data.length;

		switch (Format) {
			case FMT_FDI: /* If .FDI format... */
				/* Allocate memory and read file */
				P = newBuffer(J, Data);
				/* Verify .FDI format tag */
				if (cmpStrToBuffer(P,0,"FDI")) {
					return 0;
				}
				/* Eject current disk image */
				this.EjectFDI(D);
				/* Read disk dimensions */
				D.Sides   = FDI_SIDES(P);
				D.Tracks  = FDI_TRACKS(P);
				D.Sectors = 0;
				D.SecSize = 0;
				/* Check number of sectors and sector size */
				for(J = FDI_SIDES(P) * FDI_TRACKS(P), DDir = FDI_DIR(P); J; J--)
				{
					/* Get number of sectors */
					I = FDI_SECTORS(DDir);
					/* Check that all tracks have the same number of sectors */
					if (!D.Sectors) {
						D.Sectors = I;
					}
					else if (D.Sectors != I) {
						break;
					}
					/* Check that all sectors have the same size */
					for(DDir = subBuffer(DDir,7); I; I--, DDir = subBuffer(DDir, 7))
						if (!D.SecSize) {
							D.SecSize = FDI_SECSIZE(DDir);
						}
						else if (D.SecSize != FDI_SECSIZE(DDir)) {
							break;
						}
					/* Drop out if the sector size is not uniform */
					if(I) break;
				}
				/* If no uniform sectors or sector size, set them to zeros */
				if(J) D.Sectors = D.SecSize = 0;
				break;

			case FMT_DSK: /* If .DSK format... */
				/* Check magic number */
				if((Data[0] != 0xE9) && (Data[0] != 0xEB)) {
					return 0;
				}
				/* Check media descriptor */
				if (Data[21] < 0xF8) {
					return 0;
				}
				/* Compute disk geometry */
				K = Data[26]+(Data[27]<<8);       /* Heads   */
				N = Data[24]+(Data[25]<<8);       /* Sectors */
				L = Data[11]+(Data[12]<<8);       /* SecSize */
				I = Data[19]+(Data[20]<<8);       /* Total S.*/
				I = (K && N) ? idiv(idiv(I,K),N) : (0);                   /* Tracks  */
				/* Number of heads CAN BE WRONG */
				K = (I && N && L) ? idiv(idiv(idiv(J,I),N),L) : (0);
				/* Create a new disk image */
				P = this.NewFDI(D,K,I,N,L);
				if (!P) {
					return 0;
				}
				/* Make sure we do not read too much data */
				I = K*I*N*L;
				J = J>I ? I : J;
				/* Read disk image file (ignore short reads!) */
				cpyDataToBuffer(P,0, Data);
				/* Done */
				P = D.Data;
				break;

			default:
				/* Format not recognized */
				return(0);
		}

		if (D.Verbose) {
			console.log("LoadFDI(): Loaded '",FileName,"', ",D.Sides," sides x ",D.Tracks," tracks x ",D.Sectors," sectors x ",D.SecSize," bytes");
		}

		/* Done */
		D.Data   = P;
		D.Format = Format;
		return Format;
	};


	/** SaveFDI() ************************************************/
	/** Save a disk image to a given file, in a given format    **/
	/** (see FMT_* #defines). Use the original format when      **/
	/** when Format=FMT_AUTO. Returns format ID on success or   **/
	/** 0 on failure.                                           **/
	/*************************************************************/
	FDIDisk.prototype.SaveFDI = function (D,FileName,Format,Data)
	{
		return 0;
/*
		byte S[32];
		int I,J,K,C,L;
		FILE *F;
		byte *P,*T;

		// Must have a disk to save
		if(!D->Data) return(0);
		// Use original format if requested
		if(!Format) Format=D->Format;
		/* Open file for writing 
		if(!(F=fopen(FileName,"wb"))) return(0);

		// Depending on the format...
		switch(Format)
		{
			case FMT_FDI:
				if(fwrite(D->Data,1,D->DataSize,F)!=D->DataSize)
				{ fclose(F);unlink(FileName);return(0); }
				break;

			case FMT_DSK:
				// Scan through all tracks
				J = FDI_SIDES(D->Data)*FDI_TRACKS(D->Data);
				for(P=FDI_DIR(D->Data);J;--J,P=T)
				{
					// Compute total track length for this format
					L = Formats[Format].Sectors*Formats[Format].SecSize;
					// For every sector on a track, if track length remains...
					for(I=FDI_SECTORS(P),T=P+7;I;--I,T+=7)
						if(L)
						{
							// Write out a sector
							K = FDI_SECSIZE(T);
							K = K>L? L:K;
							L-= K;
							if(fwrite(FDI_SECTOR(D->Data,P,T),1,K,F)!=K)
							{ fclose(F);unlink(FileName);return(0); }
						}
					// Fill remaining track length with zeros
					if(L>0) fseek(F,L,SEEK_CUR);
				}
				// Done
				break;

			default:
				// Can't save this format for now
				fclose(F);
				unlink(FileName);
				return(0);
		}

		// Done
		fclose(F);
		return(Format);
				*/
	};

	/** SeekFDI() ************************************************/
	/** Seek to given side/track/sector. Returns sector address **/
	/** on success or 0 on failure.                             **/
	/*************************************************************/
	FDIDisk.prototype.SeekFDI = function(D, Side, Track, SideID, TrackID, SectorID)
	{
		var P,T;
		var J;

		// Have to have disk mounted
		if (!D || !D.Data)
			return 0;

		switch(D.Format)
		{
			case FMT_TRD:
			case FMT_DSK:
			case FMT_SCL:
			case FMT_FDI:
			case FMT_MGT:
			case FMT_IMG:
			case FMT_CPCDSK:
			case FMT_SF7000:
				/* Track directory */
				P = FDI_DIR(D.Data);
				/* Find current track entry */
				for (J = Track * D.Sides + Side % D.Sides; J; J--) P = subBuffer(P, (FDI_SECTORS(P)+1)*7);
				/* Find sector entry */
				for (J = FDI_SECTORS(P), T = subBuffer(P, 7); J; J--, T = subBuffer(T, 7)) {
					if((T[0] == TrackID) && (T[1] == SideID) && (T[2] == SectorID))
						break;
				}
				/* Fall out if not found */
				if (!J)
					return 0;
				/* FDI stores a header for each sector */
				D.Header[0] = T[0];
				D.Header[1] = T[1];
				D.Header[2] = T[2];
				D.Header[3] = T[3]<=3? T[3]:3;
				D.Header[4] = T[4];
				D.Header[5] = 0x00;
				/* FDI has variable sector numbers and sizes */
				D.Sectors   = FDI_SECTORS(P);
				D.SecSize   = FDI_SECSIZE(T);
				return FDI_SECTOR(D.Data,P,T);
		}

		// Unknown format
		return 0;
	};


	var WD1793_KEEP    = 0;
	var WD1793_INIT    = 1;
	var WD1793_EJECT   = 2;

	var WD1793_COMMAND = 0;
	var WD1793_STATUS  = 0;
	var WD1793_TRACK   = 1;
	var WD1793_SECTOR  = 2;
	var WD1793_DATA    = 3;
	var WD1793_SYSTEM  = 4;
	var WD1793_READY   = 4;

	var WD1793_IRQ     = 0x80;
	var WD1793_DRQ     = 0x40;

                           /* Common status bits:               */
	var F_BUSY     = 0x01;    /* Controller is executing a command */
	var F_READONLY = 0x40;    /* The disk is write-protected       */
	var F_NOTREADY = 0x80;    /* The drive is not ready            */

                           /* Type-1 command status:            */
	var F_INDEX    = 0x02;    /* Index mark detected               */
	var F_TRACK0   = 0x04;    /* Head positioned at track #0       */
	var F_CRCERR   = 0x08;    /* CRC error in ID field             */
	var F_SEEKERR  = 0x10;    /* Seek error, track not verified    */
	var F_HEADLOAD = 0x20;    /* Head loaded                       */

                           /* Type-2 and Type-3 command status: */
	var F_DRQ      = 0x02;    /* Data request pending              */
	var F_LOSTDATA = 0x04;    /* Data has been lost (missed DRQ)   */
	var F_ERRCODE  = 0x18;    /* Error code bits:                  */
	var F_BADDATA  = 0x08;    /* 1 = bad data CRC                  */
	var F_NOTFOUND = 0x10;    /* 2 = sector not found              */
	var F_BADID    = 0x18;    /* 3 = bad ID field CRC              */
	var F_DELETED  = 0x20;    /* Deleted data mark (when reading)  */
	var F_WRFAULT  = 0x20;    /* Write fault (when writing)        */

	var C_DELMARK  = 0x01;
	var C_SIDECOMP = 0x02;
	var C_STEPRATE = 0x03;
	var C_VERIFY   = 0x04;
	var C_WAIT15MS = 0x04;
	var C_LOADHEAD = 0x08;
	var C_SIDE     = 0x08;
	var C_IRQ      = 0x08;
	var C_SETTRACK = 0x10;
	var C_MULTIREC = 0x10;

	var S_DRIVE    = 0x03;
	var S_RESET    = 0x04;
	var S_HALT     = 0x08;
	var S_SIDE     = 0x10;
	var S_DENSITY  = 0x20;

	function WD1793() {
		this.Disk = [undefined,undefined,undefined,undefined]; // Disk images FDIDisk*[4] 
		this.R = [0,0,0,0,0];        // Registers byte[5]
		this.Drive = 0;       // Current disk # byte 
		this.Side = 0;        // Current side # byte 
		this.Track = [0,0,0,0];    // Current track # byte[4]
		this.LastS = 0;       // Last STEP direction byte 
		this.IRQ = 0;         // 0x80: IRQ pending, 0x40: DRQ pending byte 
		this.Wait = 0;        // Expiration counter byte 
		this.WRLength = 0;    // Data left to write int  
		this.RDLength = 0;    // Data left to read int  
		this.Ptr = undefined;        // Pointer to data byte*
		this.Verbose = 0;     // 1: Print debugging messages byte 

	}

	/** Reset1793() **********************************************/
	/** Reset WD1793. When Eject=WD1793_INIT, also initialize   **/
	/** disks. When Eject=WD1793_EJECT, eject inserted disks,   **/
	/** freeing memory.                                         **/
	/*************************************************************/
	WD1793.prototype.Reset1793 = function(D, Disks, Eject) {
		var J;

		D.R[0]     = 0x00;
		D.R[1]     = 0x00;
		D.R[2]     = 0x00;
		D.R[3]     = 0x00;
		D.R[4]     = S_RESET|S_HALT;
		D.Drive    = 0;
		D.Side     = 0;
		D.LastS    = 0;
		D.IRQ      = 0;
		D.WRLength = 0;
		D.RDLength = 0;
		D.Wait     = 0;

		/* For all drives... */
		for(J=0; J<4; J++)
		{
			/* Reset drive-dependent state */
			D.Disk[J]  = Disks ? Disks[J] : undefined;
			D.Track[J] = 0;
			/* Initialize disk structure, if requested */
			if((Eject == WD1793_INIT) && D.Disk[J])
				D.Disk[J].InitFDI(D.Disk[J]);
			/* Eject disk image, if requested */
			if((Eject == WD1793_EJECT) && D.Disk[J])
				D.Disk[J].EjectFDI(D.Disk[J]);
		}
	};

	/** Read1793() ***********************************************/
	/** Read value from a WD1793 register A. Returns read data  **/
	/** on success or 0xFF on failure (bad register address).   **/
	/*************************************************************/
	WD1793.prototype.Read1793 = function(D, A) {
		switch(A)
		{
			case WD1793_STATUS:
				A = D.R[0];
				/* If no disk present, set F_NOTREADY */
				if(!D.Disk[D.Drive] || !D.Disk[D.Drive].Data)
					A|=F_NOTREADY;
				/* When reading status, clear all bits but F_BUSY and F_NOTREADY */
				D.R[0] &= F_BUSY|F_NOTREADY;
				return A;
			case WD1793_TRACK:
			case WD1793_SECTOR:
				/* Return track/sector numbers */
				return D.R[A];
			case WD1793_DATA:
				/* When reading data, load value from disk */
				if(!D.RDLength) {
					if(D.Verbose)
						console.log("WD1793: EXTRA DATA READ");
				}
				else {
					/* Read data */
					D.Ptr = subBuffer(D.Ptr, 1);
					D.R[A] = D.Ptr[0];
					/* Decrement length */
					D.RDLength--;
					if(D.RDLength)
					{
						/* Reset timeout watchdog */
						D.Wait=255;
						/* Advance to the next sector as needed */
						if(!(D.RDLength & (D.Disk[D.Drive].SecSize-1))) {
							D.R[2]++;
						}
					}
					else
					{
						/* Read completed */
						if(D.Verbose)
							console.log("WD1793: READ COMPLETED");
						D.R[0] &= ~(F_DRQ|F_BUSY);
						D.IRQ  = WD1793_IRQ;
					}
				}
				return D.R[A];
			case WD1793_READY:
				/* After some idling, stop read/write operations */
				if(D.Wait) {
					D.Wait--;
					if(!D.Wait) {
						if(D.Verbose)
							console.log("WD1793: COMMAND TIMED OUT");
						D.RDLength = D.WRLength = 0;
						D.R[0] = (D.R[0] & ~(F_DRQ|F_BUSY)) | F_LOSTDATA;
						D.IRQ  = WD1793_IRQ;
					}
				}
				/* Done */
				return D.IRQ;
		}

		/* Bad register */
		return 0xFF;
	};

	/** Write1793() **********************************************/
	/** Write value V into WD1793 register A. Returns DRQ/IRQ   **/
	/** values.                                                 **/
	/*************************************************************/
	WD1793.prototype.Write1793 = function(D, A, V) {
		var J;
		switch (A)
		{
			case WD1793_COMMAND:
				// Reset interrupt request
				D.IRQ=0;
				// If it is FORCE-IRQ command...
				if ((V&0xF0) == 0xD0)
				{
					if (D.Verbose)
						console.log("WD1793: FORCE-INTERRUPT (",Utils.toHex8(V),")");
					// Reset any executing command
					D.RDLength = D.WRLength = 0;
					// Either reset BUSY flag or reset all flags if BUSY=0
					if (D.R[0] & F_BUSY)
						D.R[0] &= ~F_BUSY;
					else
						D.R[0] = D.Track[D.Drive]? 0 : F_TRACK0;
					// Cause immediate interrupt if requested
					if (V & C_IRQ)
						D.IRQ = WD1793_IRQ;
					// Done
					return D.IRQ;
				}
				// If busy, drop out
				if (D.R[0] & F_BUSY)
					break;
				// Reset status register
				D.R[0] = 0x00;
				// Depending on the command...
				switch (V & 0xF0)
				{
					case 0x00: // RESTORE (seek track 0)
						if (D.Verbose)
							console.log("WD1793: RESTORE-TRACK-0 (",Utils.toHex8(V),")");
						D.Track[D.Drive] = 0;
						D.R[0] = F_INDEX|F_TRACK0|((V & C_LOADHEAD) ? F_HEADLOAD : 0);
						D.R[1] = 0;
						D.IRQ  = WD1793_IRQ;
						break;

					case 0x10: // SEEK
						if (D.Verbose)
							console.log("WD1793: SEEK-TRACK ",D.R[3]," (",Utils.toHex8(V),")");
						// Reset any executing command
						D.RDLength = D.WRLength = 0;
						D.Track[D.Drive] = D.R[3];
						D.R[0] = F_INDEX
							| (D.Track[D.Drive] ? 0 : F_TRACK0)
							| ((V & C_LOADHEAD) ? F_HEADLOAD : 0);
						D.R[1] = D.Track[D.Drive];
						D.IRQ  = WD1793_IRQ;
						break;

					case 0x20: /* STEP */
					case 0x30: /* STEP-AND-UPDATE */
					case 0x40: /* STEP-IN */
					case 0x50: /* STEP-IN-AND-UPDATE */
					case 0x60: /* STEP-OUT */
					case 0x70: /* STEP-OUT-AND-UPDATE */
						if (D.Verbose)
							console.log("WD1793: STEP",(V&0x40? (V&0x20? "-OUT":"-IN"):""),(V&0x10? "-AND-UPDATE":"")," (",Utils.toHex8(V),")");
						// Either store or fetch step direction
						if (V&0x40)
							D.LastS = V&0x20;
						else
							V = (V & ~0x20) | D.LastS;
						// Step the head, update track register if requested
						if (V&0x20) {
							if (D.Track[D.Drive])
								D.Track[D.Drive]--;
						}
						else {
							D.Track[D.Drive]++;
						}
						// Update track register if requested
						if (V & C_SETTRACK)
							D.R[1] = D.Track[D.Drive];
						// Update status register
						D.R[0] = F_INDEX|(D.Track[D.Drive] ? 0 : F_TRACK0);
						// @@@ WHY USING J HERE?
						//                  | (J&&(V&C_VERIFY)? 0:F_SEEKERR);
						/* Generate IRQ */
						D.IRQ  = WD1793_IRQ;          
						break;

					case 0x80:
					case 0x90: // READ-SECTORS
						if (D.Verbose)
							console.log("WD1793: READ-SECTOR",(V&0x10? "S":"")," ",String.fromCharCode(65+D.Drive),":",D.Side,":",D.R[1],":",D.R[2]," (",Utils.toHex8(V),")");
						// Seek to the requested sector
						D.Ptr = SeekFDI(
							D.Disk[D.Drive], D.Side, D.Track[D.Drive],
							(V&C_SIDECOMP) ? (!!(V&C_SIDE)) : (D.Side,D.R[1],D.R[2])
						);
						// If seek successful, set up reading operation
						if (!D.Ptr) {
							if (D.Verbose)
								console.log("WD1793: READ ERROR");
							D.R[0]     = (D.R[0] & ~F_ERRCODE)|F_NOTFOUND;
							D.IRQ      = WD1793_IRQ;
						}
						else {
							D.RDLength = D.Disk[D.Drive].SecSize * ( (V & 0x10) ? (D.Disk[D.Drive].Sectors-D.R[2]+1) : 1);
							D.R[0]    |= F_BUSY|F_DRQ;
							D.IRQ      = WD1793_DRQ;
							D.Wait     = 255;
						}
						break;

					case 0xA0:
					case 0xB0: // WRITE-SECTORS
						if (D.Verbose)
							console.log("WD1793: WRITE-SECTOR",(V&0x10? "S":"")," ",String.fromCharCode(65+D.Drive),":",D.Side,":",D.R[1],":",D.R[2]," (",Utils.toHex8(V),")");
						// Seek to the requested sector
						D.Ptr = SeekFDI(
							D.Disk[D.Drive], D.Side, D.Track[D.Drive],
							(V & C_SIDECOMP) ? (!!(V&C_SIDE)) : D.Side,D.R[1], D.R[2]
						);
						// If seek successful, set up writing operation
						if (!D.Ptr)
						{
							if (D.Verbose)
								console.log("WD1793: WRITE ERROR");
							D.R[0]     = (D.R[0] & ~F_ERRCODE) | F_NOTFOUND;
							D.IRQ      = WD1793_IRQ;
						}
						else
						{
							D.WRLength = D.Disk[D.Drive].SecSize * ( (V & 0x10) ? (D.Disk[D.Drive].Sectors-D.R[2]+1) : 1);
							D.R[0]    |= F_BUSY|F_DRQ;
							D.IRQ      = WD1793_DRQ;
							D.Wait     = 255;
						}
						break;

					case 0xC0: // READ-ADDRESS
						if (D.Verbose)
							console.log("WD1793: READ-ADDRESS (",Utils.toHex8(V),")");
						// Read first sector address from the track
						if (!D.Disk[D.Drive]) {
							D.Ptr=0;
						}
						else {
							for (J = 0;J < 256; J++)
							{
								D.Ptr = SeekFDI(
									D.Disk[D.Drive],
									D.Side, D.Track[D.Drive],
									D.Side, D.Track[D.Drive], J
								);
								if (D.Ptr)
									break;
							}
						}
						// If address found, initiate data transfer
						if (!D.Ptr) {
							if (D.Verbose)
								console.log("WD1793: READ-ADDRESS ERROR");
							D.R[0]    |= F_NOTFOUND;
							D.IRQ      = WD1793_IRQ;
						}
						else {
							D.Ptr      = D.Disk[D.Drive].Header;
							D.RDLength = 6;
							D.R[0]    |= F_NOTREADY|F_BUSY|F_DRQ;
							D.IRQ      = WD1793_DRQ;
							D.Wait     = 255;
						}
						break;

					case 0xE0: // READ-TRACK
						if (D.Verbose)
							console.log("WD1793: READ-TRACK ",D.R[1]," (",Utils.toHex8(V),") UNSUPPORTED!");
						break;

					case 0xF0: // WRITE-TRACK
						if (D.Verbose)
							console.log("WD1793: WRITE-TRACK ",D.R[1]," (",Utils.toHex8(V),") UNSUPPORTED!");
						break;

					default: // UNKNOWN
						if (D.Verbose)
							console.log("WD1793: UNSUPPORTED OPERATION ",Utils.toHex8(V),"!");
						break;
				}
				break;

			case WD1793_TRACK:
			case WD1793_SECTOR:
				if (!(D.R[0] & F_BUSY))
					D.R[A] = V;
				break;

			case WD1793_SYSTEM:
				// @@@ Too verbose
				//      if(D.Verbose) printf("WD1793: Drive %c, %cD side %d\n",'A'+(V&S_DRIVE),V&S_DENSITY? 'D':'S',V&S_SIDE? 0:1);
				// Reset controller if S_RESET goes up
				if ((D.R[4] ^ V) & V & S_RESET)
					Reset1793(D,D.Disk[0],WD1793_KEEP);
				// Set disk #, side #, ignore the density (@@@)
				D.Drive = V & S_DRIVE;
				D.Side  = !(V & S_SIDE);
				// Save last written value
				D.R[4]  = V;
				break;

			case WD1793_DATA:
				// When writing data, store value to disk 
				if (!D.WRLength) {
					if (D.Verbose)
						console.log("WD1793: EXTRA DATA WRITE (",Utils.toHex8(V),")");
				}
				else {
					// Write data
					D.Ptr[0] = V;
					D.Ptr = subBuffer(D.Ptr,1);
					// Decrement length 
					D.WRLength--;
					if (D.WRLength) {
						// Reset timeout watchdog
						D.Wait = 255;
						// Advance to the next sector as needed
						if(!(D.WRLength & (D.Disk[D.Drive].SecSize-1)))
							D.R[2]++;
					}
					else
					{
						// Write completed
						if (D.Verbose)
							console.log("WD1793: WRITE COMPLETED");
						D.R[0]&= ~(F_DRQ|F_BUSY);
						D.IRQ  = WD1793_IRQ;
					}
				}
				// Save last written value
				D.R[A]=V;
				break;
		}

		// Done 
		return(D.IRQ);
	};

	exports.FDIDisk = FDIDisk;
	exports.WD1793 = WD1793;
	return exports;
});

