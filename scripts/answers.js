
(function () {
    const Answers = {
        quiz: null,
        correctAnswers: [],
        userResult: [],

        init() {
            const quizId = sessionStorage.getItem('quizId');

            const contentElement =
                document.getElementById('answers-content');

            if (!quizId || !contentElement) {
                location.href = 'index.html';
                return;
            }

            try {
                this.userResult = JSON.parse(
                    sessionStorage.getItem('userResult') || '[]'
                );

                if (!Array.isArray(this.userResult)) {
                    this.userResult = [];
                }
            } catch (error) {
                this.userResult = [];
            }

            this.loadData(quizId);
        },

        async loadData(quizId) {
            const contentElement =
                document.getElementById('answers-content');

            contentElement.innerText = 'Загрузка ответов...';

            try {
                // Загружаем вопросы теста.
                const quizResponse = await fetch(
                    'https://testologia.ru/get-quiz?id=' +
                    encodeURIComponent(quizId)
                );

                if (!quizResponse.ok) {
                    throw new Error('Не удалось загрузить тест');
                }

                this.quiz = await quizResponse.json();

                // Загружаем правильные ответы.
                const correctResponse = await fetch(
                    'https://testologia.ru/get-quiz-right?id=' +
                    encodeURIComponent(quizId)
                );

                if (!correctResponse.ok) {
                    throw new Error(
                        'Не удалось загрузить правильные ответы'
                    );
                }

                this.correctAnswers = await correctResponse.json();

                if (
                    !this.quiz ||
                    !Array.isArray(this.quiz.questions) ||
                    !Array.isArray(this.correctAnswers)
                ) {
                    throw new Error('Некорректные данные сервера');
                }

                this.showTestName();
                this.showAnswers();

            } catch (error) {
                console.error(error);

                contentElement.innerText =
                    'Не удалось загрузить ответы. Попробуйте обновить страницу.';
            }
        },

        showTestName() {
            const testNameElement =
                document.getElementById('test-name');

            if (testNameElement) {
                testNameElement.innerText = this.quiz.name;
            }
        },

        showAnswers() {
            const contentElement =
                document.getElementById('answers-content');

            contentElement.innerHTML = '';

            this.quiz.questions.forEach((question, index) => {
                const answerItem = document.createElement('div');
                answerItem.className = 'answer-item';

                // Заголовок вопроса.
                const title = document.createElement('h3');
                title.className = 'answer-item__title';

                const number = document.createElement('span');
                number.innerText = 'Вопрос ' + (index + 1) + ':';

                title.appendChild(number);

                title.appendChild(
                    document.createTextNode(' ' + question.question)
                );

                answerItem.appendChild(title);

                // Контейнер вариантов.
                const options = document.createElement('div');
                options.className = 'answer-options';

                // Ищем ответ пользователя.
                const userAnswer = this.userResult.find(item => {
                    return Number(item.questionId) ===
                        Number(question.id);
                });

                question.answers.forEach(answer => {
                    const option = document.createElement('div');

                    option.className = 'answer-option';

                    const radio = document.createElement('span');
                    radio.className = 'answer-option__radio';

                    const answerText =
                        document.createTextNode(answer.answer);

                    // Проверяем, выбрал ли пользователь
                    // именно этот вариант.
                    const isUserAnswer =
                        userAnswer &&
                        userAnswer.chooseAnswerId !== null &&
                        userAnswer.chooseAnswerId !== undefined &&
                        Number(userAnswer.chooseAnswerId) ===
                            Number(answer.id);

                    // Проверяем правильность выбранного варианта.
                    const isCorrect =
                        this.correctAnswers.some(item => {
                            const correctId =
                                typeof item === 'object'
                                    ? item.answerId ?? item.id
                                    : item;

                            return Number(correctId) ===
                                Number(answer.id);
                        });

                    // Подсвечиваем ТОЛЬКО выбранный ответ.
                    if (isUserAnswer) {
                        if (isCorrect) {
                            option.classList.add(
                                'answer-option--correct'
                            );
                        } else {
                            option.classList.add(
                                'answer-option--wrong'
                            );
                        }
                    }

                    option.appendChild(radio);
                    option.appendChild(answerText);

                    options.appendChild(option);
                });

                answerItem.appendChild(options);
                contentElement.appendChild(answerItem);
            });
        }
    };

    Answers.init();
})();
