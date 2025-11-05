import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as languageSkillController from '../controllers/language-skill.controller';

const router = Router();

router.get('/me', authenticate, languageSkillController.getMyLanguageSkills);
router.get('/user/:userId', languageSkillController.getUserLanguageSkills);
router.post('/', authenticate, languageSkillController.createLanguageSkill);
router.put('/:id', authenticate, languageSkillController.updateLanguageSkill);
router.delete('/:id', authenticate, languageSkillController.deleteLanguageSkill);

export default router;

