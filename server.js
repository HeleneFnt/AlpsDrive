const express = require('express');
const fs = require('fs').promises;
const path = require('path');
// Chemin du dossier temporaire de l'OS
const tmpDir = require('os').tmpdir();
const subFolderName = 'testnode';
const {show} = require('./lib/functions');

function start() {
    const app = express();

    // Middleware pour les en-têtes CORS
    app.use(function (req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        next(); // Passe au prochain middleware
    });


    // Route pour récupérer la liste des fichiers et dossiers à la racine du drive
    app.get("/api/drive", async (req, res) => {
        try {
            const response = await show();

            console.log(response);
            return res.status(200).json(response);
        } catch
            (error) {
            console.error('Erreur lors de la récupération des fichiers à la racine du drive :', error);
            res.status(500).json({error: 'Une erreur s\'est produite lors de la récupération des fichiers à la racine du drive.'});
        }
    });


    //  Route pour retourner le contenu de {name}
    app.get("/api/drive/:name", async (req, res) => {
        const name = req.params.name
       // Faire apparaitre l'erreur 400 sur http://localhost:3000/api/drive/nomBidonQuiNexistePas
        // if (!name){
        //     return res.status(404).send('Mouhahahah');
        // }else {

            try {
                // Récupération de la liste des fichiers à la racine du dossier temporaire de l'OS
                const response = await show(path.join(tmpDir, subFolderName, name));

                return res.status(200).json(response);
            } catch (error) {
                console.error('Erreur lors de la récupération des fichiers à la racine du drive :', error);
                res.status(500).json({error: 'Une erreur s\'est produite lors de la récupération des fichiers à la racine du drive.'});
            }
        }
    });


    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = {start};
