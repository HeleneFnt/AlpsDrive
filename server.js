const express = require('express');
const busboy = require('express-busboy');
const fs = require('fs').promises;
const path = require('path');
const tmpDir = require('os').tmpdir();
const subFolderName = 'testnode';
const { show, hasValidName} = require('./lib/functions');

function start() {
    const app = express();

    // Configuration de express-busboy
    busboy.extend(app, {
        upload: true,
        allowedPath: /./
    });

    app.use(function (req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        next();
    });

// Route pour afficher les dossiers et fichiers
    app.get("/api/drive", async (req, res) => {
        try {
            const response = await show(path.join(tmpDir, subFolderName));
            return res.status(200).json(response);
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers à la racine du drive :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des fichiers à la racine du drive.' });
        }
    });
// Route pour afficher les sous-dossiers et fichiers
    app.get("/api/drive/:path(*)", async (req, res) => {
        const name = req.params.path || "";
        const paths = req.url.replaceAll('/api/drive', '/').split('/');
        const fullPath = path.join(tmpDir, subFolderName, ...paths);

        console.log('FULL PATH', fullPath)
        try {
            await fs.access(fullPath);
            const fileStats = await fs.stat(fullPath);

            if (fileStats.isFile()) {
                return res.status(200).contentType('application/octet-stream').sendFile(fullPath);
            }

            const response = await show(fullPath);
            return res.status(200).json(response);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`Le fichier ou dossier "${name}" n'existe pas.`);
                return res.status(404).json({ error: 'Le fichier ou dossier spécifié n\'existe pas.' });
            }

            console.error('Erreur lors de la récupération des fichiers du dossier :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des fichiers du dossier spécifié.' });
        }
    });

    // Route pour créer un dossier à la racine du drive
    app.post("/api/drive/", async (req, res) => {
        const newDirectoryName = req.query.name;
        const newPath = path.join(tmpDir, subFolderName, newDirectoryName);

        const regex = /^[a-zA-Z0-9]+$/;

        if (!regex.test(newDirectoryName)) {
            console.error('Le nom de dossier contient des caractères non-alphanumériques !!!!!!');
            return res.status(400).json({ error: 'Le nom de dossier contient des caractères non-alphanumériques !!!!!!' });
        }

        try {
            await fs.mkdir(newPath);
            const updatedResponse = await show(path.join(tmpDir, subFolderName));
            return res.status(201).json(updatedResponse);
        } catch (error) {
            console.error('Erreur lors de la création du dossier :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la création du dossier.' });
        }
    });

    //Route pour créer un dossier à partir d'un sous-dossier
    app.post("/api/drive/:folder", async (req, res) => {
        const folder = req.params.folder;
        const newDirectoryName = req.query.name;
        const newPath = path.join(tmpDir, subFolderName, folder, newDirectoryName);

        if (!hasValidName(newDirectoryName)) {
            console.error('Le nom de dossier contient des caractères non-alphanumériques !!!!!!');
            return res.status(400).json({ error: 'Le nom de dossier contient des caractères non-alphanumériques !!!!!!' });
        }

        try {
            await fs.mkdir(newPath);
            const updatedResponse = await show(path.join(tmpDir, subFolderName));
            return res.status(201).json(updatedResponse);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: 'Le dossier parent n\'existe pas.' });
            }
            console.error('Erreur lors de la création du dossier :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la création du dossier.' });
        }
    });

    // Route pour supprimer un dossier ou un fichier depuis la racine du drive
    app.delete("/api/drive/:name", async (req, res) => {
        const name = req.params.name;
        const fullPath = path.join(tmpDir, subFolderName, name);

        if (!hasValidName(name)) {
            console.error('Le nom contient des caractères non-alphanumériques !!!!!!');
            return res.status(400).json({ error: 'Le nom contient des caractères non-alphanumériques !!!!!!' });
        }

        try {
            const fileStats = await fs.stat(fullPath);

            if (fileStats.isFile()) {
                await fs.unlink(fullPath);
            } else {
                await fs.rmdir(fullPath, { recursive: true });
            }

            const updatedResponse = await show(path.join(tmpDir, subFolderName));
            return res.status(200).json(updatedResponse);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: 'Le fichier ou dossier spécifié n\'existe pas.' });
            }

            console.error('Erreur lors de la suppression du fichier ou du dossier :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la suppression du fichier ou du dossier spécifié.' });
        }
    });
    //  // Route pour charger un fichier à la racine du drive
    app.put("/api/drive", async (req, res) => {
        const fileContent = req.files.file;
        console.log('FILE', fileContent);

        // Vérification du contenu du fichier
        if (!fileContent) {
            console.error('Aucun fichier n\'est présent dans la requête !!!!!!');
            return res.status(400).json({ error: 'Aucun fichier n\'est présent dans la requête !!!!!!' });
        }

        try {
            // Chemin complet pour le nouveau fichier
            const newFilePath = path.join(tmpDir, subFolderName, fileContent.filename);

            // Écriture du contenu dans le fichier
            await fs.writeFile(newFilePath, fileContent.file, 'utf-8');

            // Récupération de la liste des fichiers mise à jour
            const updatedResponse = await show(path.join(tmpDir, subFolderName));
            return res.status(201).json(updatedResponse);
        } catch (error) {
            console.error('Erreur lors de la création du fichier :', error);
            res.status(500).json({ error: 'Une erreur s\'est produite lors de la création du fichier.' });
        }
    });



    app.listen(process.env.ALPS_DRIVE_PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.ALPS_DRIVE_PORT || 3000}`);
    });
}

module.exports = { start };
