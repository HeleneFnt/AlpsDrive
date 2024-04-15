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
            res.status(500).json({error: 'Une erreur s\'est produite lors de la récupération des fichiers à la racine du drive.'});
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
                return res.status(200).contentType('application/octet-stream').sendFile(fullPath);
            }

            // Si c'est un dossier, retourner son contenu
            const response = await show(fullPath);
            return res.status(200).json(response);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`Le fichier ou dossier "${name}" n'existe pas.`);
                return res.status(404).json({error: 'Autant chercher une aiguille dans une botte de fouin !'});
            }
            console.error('Erreur lors de la récupération des fichiers du dossier :', error);
            res.status(500).json({error: 'Une erreur s\'est produite lors de la récupération des fichiers du dossier spécifié.'});
        }
    });

// Créer un dossier avec un nom respectant les consignes
    app.post("/api/drive/", async (req, res) => {
        const newDirectoryName = req.query.name;
        const newPath = path.join(tmpDir, subFolderName, newDirectoryName); // Chemin complet pour le nouveau dossier

        // Vérification du nom du dossier pour s'assurer qu'il est alphanumérique
        const regex = /^[a-zA-Z0-9]+$/; // Expression régulière pour vérifier si le nom contient seulement des lettres et des chiffres
        if (!regex.test(newDirectoryName)) {
            console.error('Le nom de dossier contient des caractères non-alphanumériques !!!!!!');
            return res.status(400).json({error: 'Le nom de dossier contient des caractères non-alphanumériques !!!!!!'});
        }

        try {
            // Création du dossier
            await fs.mkdir(newPath);

            // Récupération de la liste des fichiers mise à jour
            const updatedResponse = await show(path.join(tmpDir, subFolderName));
            return res.status(201).json(updatedResponse);
        } catch (error) {
            console.error('Erreur lors de la création du dossier :', error);
            res.status(500).json({error: 'Une erreur s\'est produite lors de la création du dossier.'});
        }
    });

    app.post("/api/drive/:folder", async (req, res) => {
        const folder = req.params.folder; // Récupère le nom du dossier parent depuis l'URL
        const newDirectoryName = req.query.name;

        // Chemin complet pour le nouveau dossier
        const newPath = path.join(tmpDir, subFolderName, folder, newDirectoryName);

        // Vérification du nom du dossier pour s'assurer qu'il est alphanumérique
        const regex = /^[a-zA-Z0-9]+$/; // Expression régulière pour vérifier si le nom contient seulement des lettres et des chiffres
        if (!regex.test(newDirectoryName)) {
            console.error('Le nom de dossier contient des caractères non-alphanumériques !!!!!!');
            return res.status(400).json({error: 'Le nom de dossier contient des caractères non-alphanumériques !!!!!!'});
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

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

}
module.exports = { start };
