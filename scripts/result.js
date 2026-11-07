
(function () {
    const Result = {
        init() {
            const url = new URL(location.href);

            let score = url.searchParams.get('score');
            let total = url.searchParams.get('total');

            if (score === null) {
                score = sessionStorage.getItem('quizScore');
            }

            if (total === null) {
                total = sessionStorage.getItem('quizTotal');
            }

            score = Number(score);
            total = Number(total);

            if (
                !Number.isFinite(score) ||
                !Number.isFinite(total) ||
                total <= 0 ||
                score < 0 ||
                score > total
            ) {
                location.href = 'index.html';
                return;
            }

            sessionStorage.setItem('quizScore', score);
            sessionStorage.setItem('quizTotal', total);

            
            const resultElement =
                document.getElementById('result-score');

            if (resultElement) {
                resultElement.innerText =
                    `${score} / ${total}`;
            }

            
            const answersButton =
                document.getElementById('answers-button');

            if (answersButton) {
                answersButton.onclick = function () {
                    location.href = 'answers.html';
                };
            }
        }
    };

    Result.init();
})();
