const fs = require('fs').promises;
const path = require('path');
const tmpDir = require('os').tmpdir();
const subFolderName = 'testnode';

async function show(pathFolder) {
    if (!pathFolder) {
        pathFolder = path.join(tmpDir, subFolderName);
    }
    try {
        // Récupération de la liste des fichiers à la racine du dossier temporaire de l'OS
        const files = await fs.readdir(pathFolder);
        console.log(files);
        const data = [];
        // Transformation de chaque nom de fichier en objet avec des informations sur le fichier
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filePath = path.join(pathFolder, file);
            const fileStats = await fs.stat(filePath);
            if (fileStats.isDirectory()) {
                data.push({
                    name: file,
                    isFolder: true
                });
            } else {
                data.push({
                    name: file,
                    isFolder: false,
                    size: fileStats.size
                });
            }
        }
        return data;
    } catch
        (error) {
        console.error('Erreur lors de la récupération des fichiers à la racine du drive :', error);
        throw ({error: 'Une erreur s\'est produite lors de la récupération des fichiers à la racine du drive.'});
    }
}

module.exports = {show};