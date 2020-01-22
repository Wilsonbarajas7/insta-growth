const fs = require('fs');

function saveVarToJson(content){
    let actualDate = new Date();
    fs.writeFile(`./log/data_${actualDate}.json`,JSON.stringify(content), (err) =>{
        if(err){
            console.log(err)
        }
        console.log("File Saved.")
    })
}

module.exports = { saveVarToJson}