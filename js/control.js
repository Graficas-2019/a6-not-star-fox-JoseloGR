function initControls() {
    $("#start").click(
        (event) => {
            $(".game_loader").css("opacity", 0);
            startGame();
        }
    );

    $("#restart").click(
        (event) => {
            $(".game_loader").css("opacity", 0);
            restartGame();
        }
    );
}
