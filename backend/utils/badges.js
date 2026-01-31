const calculateBadges = (user, uniqueLearners) => {
    const badges = [];

    const sessions = user.totalSessions || 0;

    if (sessions >= 1) badges.push("First Step");
    if (sessions >= 5) badges.push("Session Pro");
    if (sessions >= 10) badges.push("Veteran");
    if (sessions >= 25) badges.push("Elite Mentor");
    if (sessions >= 50) badges.push("Master Mentor");

    const learners = uniqueLearners || 0;
    if (learners >= 10) badges.push("Guide");
    if (learners >= 50) badges.push("Pathfinder");
    if (learners >= 100) badges.push("Game Changer");
    if (learners >= 250) badges.push("Impact Maker");

    // Fixed: Ensure rating is treated as a number
    const rating = user.averageRating || 0;
    const numRating = parseFloat(rating);
    const reviews = user._count?.receivedReviews || user.totalReviews || 0;

    if (numRating >= 4.0) badges.push("Well Rated");
    if (numRating >= 4.5) badges.push("Top Rated");
    if (numRating >= 4.8 && reviews >= 20) badges.push("Exceptional");

    const likes = user._count?.likesReceived || 0;
    const followers = user._count?.followers || 0;

    if (likes >= 50) badges.push("Loved");
    if (followers >= 50) badges.push("Popular");
    if (followers >= 25 && likes >= 50) badges.push("Favorite");

    return badges;
};

module.exports = { calculateBadges };
