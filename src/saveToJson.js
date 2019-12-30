const fs = require('fs');

function saveVarToJson(content){
    fs.writeFile(`./data.json`,JSON.stringify(content), (err) =>{
        if(err){
            console.log(err)
        }
        console.log("File Saved.")
    })
}

module.exports = { saveVarToJson}