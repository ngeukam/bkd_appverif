const {
	getLanguageTranslations,
	getAllLanguages,
	postLanguage,
    delLanguage,
    postLanguageTranslations,
    getLanguages,
} = require('../../controllers/translation.controller');
const {userAuth} = require('../../auth')
const { Router } = require("express");

const languagesRoutes = Router();

languagesRoutes.get('/languages', getLanguages)
languagesRoutes.get('/all-languages', getAllLanguages)
languagesRoutes.post('/language', postLanguage)
languagesRoutes.delete('/language', userAuth({isAdmin: true}), delLanguage)

languagesRoutes.get('/language/translations', getLanguageTranslations)
languagesRoutes.post('/language/translations', userAuth({isAdmin: true}), postLanguageTranslations)

module.exports = languagesRoutes;