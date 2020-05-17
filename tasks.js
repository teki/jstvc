import { writeFileSync, readdirSync } from "fs";


function gamelist() {
    let gl = readdirSync("games");
    let gl2 = [];
    for (let i in gl) {
        let fn = gl[i];
        if (fn.endsWith('.zip')) {
            if (/.*zip$/i.test(gl[i]))
                gl2.push(gl[i]);
        }
    }
    gl2.sort();

    let b = "var gamelist = " + JSON.stringify(gl2) + ";\n";
    writeFileSync("games/list.json", b);
}


switch (process.argv[2]) {
    case 'gamelist': gamelist(); break;
}
