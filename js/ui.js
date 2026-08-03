export function updateUI(game) {
    const p1 = game.players[0];
    const p2 = game.players[1];
    if (p1) {
        game.dom.hpP1.style.width = (p1.hp / p1.maxHp * 100) + '%';
    }
    if (p2) {
        game.dom.hpP2.style.width = (p2.hp / p2.maxHp * 100) + '%';
    }
    game.dom.scoreP1.textContent = '🏆 ' + game.score1;
    game.dom.scoreP2.textContent = game.score2 + ' 🏆';
    game.dom.roundDisplay.textContent = '⚔️ Round ' + game.round;
}

export function showRoundWinner(game) {
    const player = game.winner;
    const name = player.id === 1 ? 'P1 🔴' : (player.isBot ? '🤖 Bot' : 'P2 🔵');
    game.dom.winnerMsg.textContent = `🏆 ${name} thắng round!`;
    game.dom.winnerMsg.style.display = 'block';
    game.dom.restartBtn.style.display = 'block';
    game.dom.restartBtn.textContent = '⏭️ Round tiếp';
}

export function showWinner(game) {
    const player = game.winner;
    const name = player.id === 1 ? 'P1 🔴' : (player.isBot ? '🤖 Bot' : 'P2 🔵');
    game.dom.winnerMsg.textContent = `👑 ${name} VÔ ĐỊCH! 👑`;
    game.dom.winnerMsg.style.display = 'block';
    game.dom.restartBtn.style.display = 'block';
    game.dom.restartBtn.textContent = '🔄 Đấu lại trận';
}
