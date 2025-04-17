// Rule-based classification utility
// categories: Weak (<40), Good (40-70), Brilliant (>70)
function classifyMark(marks) {
    if (marks < 40) return 'Weak';
    if (marks <= 70) return 'Good';
    return 'Brilliant';
}

module.exports = { classifyMark };
