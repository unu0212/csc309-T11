const { v4: uuidv4 } = require("uuid");

// Generate a One-Time Reset Token (UUID)
function generateResetToken() {
    return uuidv4();
}

module.exports = { generateResetToken };
