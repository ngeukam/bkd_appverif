import User from '../models/user';
import Project from '../models/project';

const getRandomTesters = async (projectId) => {
    // Récupérer le projet
    const project = await Project.findById(projectId);
    
    if (!project) {
        throw new Error('Project not found');
    }

    const { nb_tester, age_ranges, hobbies, business_types, phone_type } = project;

    // Construire la requête pour filtrer les testeurs selon les critères
    const query = {
        age_ranges: { $in: age_ranges },
        hobbies: { $in: hobbies },
        business_types: { $in: business_types },
        phone_type: phone_type
    };

    // Récupérer tous les utilisateurs qui correspondent aux critères
    const potentialTesters = await User.find(query);

    if (potentialTesters.length < nb_tester) {
        throw new Error('Not enough testers available');
    }

    // Mélanger et sélectionner un nombre aléatoire de testeurs
    const shuffledTesters = potentialTesters.sort(() => 0.5 - Math.random());
    const selectedTesters = shuffledTesters.slice(0, nb_tester);

    return selectedTesters;
};

export default getRandomTesters;
const payment = new Payment({
    project: projectId,
    user: userId,
    amount: amountPaid,
    status: 'completed'
});

await payment.save();
await payment.activateProjectAndNotifyTesters();
