const express = require('express');
const fs = require('fs').promises;
const path = require('path');
// Chemin du dossier temporaire de l'OS
const tmpDir = require('os').tmpdir();
const subFolderName = 'testnode';
const { show } = require('./lib/functions');  // Importation de la fonction show depuis functions.js

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
            const response = await show(path.join(tmpDir, subFolderName));
            return res.status(200).json(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers à la racine du drive :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des fichiers à la racine du drive.' });
        }
    });

    // Route pour retourner le contenu d'un dossier spécifique ou d'un fichier
    app.get("/api/drive/:name", async (req, res) => {
        const name = req.params.name;
        const fullPath = path.join(tmpDir, subFolderName, name);

        try {
            // Vérifier si le chemin existe
            await fs.access(fullPath);

            // Vérifier si c'est un fichier
            const fileStats = await fs.stat(fullPath);
            if (fileStats.isFile()) {
                const data = await fs.readFile(fullPath, 'utf-8');
                return res.status(200).json({ content: data });
            }

            // Si c'est un dossier, retourner son contenu
            const response = await show(fullPath);
            return res.status(200).json(response);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`Le fichier ou dossier "${name}" n'existe pas.`);
                return res.status(404).json({ error: 'Le fichier ou dossier n\'existe pas.' });
            }
            console.error('Erreur lors de la récupération des fichiers du dossier :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des fichiers du dossier spécifié.' });
        }
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = { start };
