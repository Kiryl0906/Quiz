(function () {
    const Test = {
        progressBarElement: null,
        passButtonElement: null,
        nextButtonElement: null,
        prevButtonElement: null,
        questionTitleElement: null,
        optionsElement: null,
        quiz: null,
        currentQuestionIndex: 1,
        userResult: [],
        timerInterval: null,
        isCompleted: false,

        init() {
            checkUserData();

            const url = new URL(location.href);
            const testId = url.searchParams.get('id');

            if (!testId) {
                location.href = 'index.html';
                return;
            }

            const xhr = new XMLHttpRequest();

            xhr.open(
                'GET',
                'https://testologia.ru/get-quiz?id=' +
                    encodeURIComponent(testId),
                false
            );

            try {
                xhr.send();

                if (xhr.status === 200 && xhr.responseText) {
                    try {
                        this.quiz = JSON.parse(xhr.responseText);
                    } catch (e) {
                        location.href = 'index.html';
                        return;
                    }

                    if (
                        !this.quiz ||
                        !Array.isArray(this.quiz.questions) ||
                        this.quiz.questions.length === 0
                    ) {
                        location.href = 'index.html';
                        return;
                    }

                    this.startQuiz();
                } else {
                    location.href = 'index.html';
                }
            } catch (e) {
                location.href = 'index.html';
            }
        },

        startQuiz() {
            this.progressBarElement =
                document.getElementById('progress-bar');

            this.questionTitleElement =
                document.getElementById('title');

            this.optionsElement =
                document.getElementById('options');

            this.nextButtonElement =
                document.getElementById('next');

            this.passButtonElement =
                document.getElementById('pass');

            this.prevButtonElement =
                document.getElementById('prev');

            if (
                !this.progressBarElement ||
                !this.questionTitleElement ||
                !this.optionsElement ||
                !this.nextButtonElement ||
                !this.passButtonElement ||
                !this.prevButtonElement
            ) {
                console.error('Не найдены необходимые элементы страницы.');
                return;
            }

            this.nextButtonElement.onclick =
                this.move.bind(this, 'next');

            this.passButtonElement.onclick =
                this.move.bind(this, 'pass');

            this.prevButtonElement.onclick =
                this.move.bind(this, 'prev');

            const preTitle = document.getElementById('pre-title');

            if (preTitle) {
                preTitle.innerText = this.quiz.name;
            }

            this.prepareProgressBar();
            this.showQuestion();

            // Таймер на 60 секунд.
            const timeElement = document.getElementById('timer');
            let seconds = 60;

            if (timeElement) {
                timeElement.innerText = seconds;
            }

            this.timerInterval = setInterval(() => {
                seconds--;

                if (timeElement) {
                    timeElement.innerText = seconds;
                }

                if (seconds <= 0) {
                    clearInterval(this.timerInterval);
                    this.complete();
                }
            }, 1000);
        },

        prepareProgressBar() {
            this.progressBarElement.innerHTML = '';

            for (
                let i = 0;
                i < this.quiz.questions.length;
                i++
            ) {
                const itemElement = document.createElement('div');

                itemElement.className =
                    'test-progress-bar-item' +
                    (i === 0 ? ' active' : '');

                const itemCircleElement =
                    document.createElement('div');

                itemCircleElement.className =
                    'test-progress-bar-item-circle';

                const itemTextElement =
                    document.createElement('div');

                itemTextElement.className =
                    'test-progress-bar-item-text';

                itemTextElement.innerText = 'Вопрос ' + (i + 1);

                itemElement.appendChild(itemCircleElement);
                itemElement.appendChild(itemTextElement);

                this.progressBarElement.appendChild(itemElement);
            }
        },

        showQuestion() {
            const activeQuestion =
                this.quiz.questions[this.currentQuestionIndex - 1];

            if (!activeQuestion) {
                this.complete();
                return;
            }

            this.questionTitleElement.innerHTML =
                '<span>Вопрос ' +
                this.currentQuestionIndex +
                ':</span> ' +
                activeQuestion.question;

            this.optionsElement.innerHTML = '';

            const chosenOption = this.userResult.find(item => {
                return item.questionId === activeQuestion.id;
            });

            if (this.passButtonElement) {
                this.passButtonElement.disabled = !!(
                    chosenOption &&
                    chosenOption.chooseAnswerId !== null
                );
            }

            activeQuestion.answers.forEach(answer => {
                const optionElement =
                    document.createElement('div');

                optionElement.className = 'test-question-option';

                const inputId = 'answer-' + answer.id;

                const inputElement =
                    document.createElement('input');

                inputElement.className = 'option-answer';
                inputElement.id = inputId;
                inputElement.type = 'radio';
                inputElement.name = 'answer';
                inputElement.value = answer.id;

                if (
                    chosenOption &&
                    chosenOption.chooseAnswerId === answer.id
                ) {
                    inputElement.checked = true;
                }

                inputElement.onchange = () => {
                    this.chooseAnswer();
                };

                const labelElement =
                    document.createElement('label');

                labelElement.htmlFor = inputId;
                labelElement.innerText = answer.answer;

                optionElement.appendChild(inputElement);
                optionElement.appendChild(labelElement);

                this.optionsElement.appendChild(optionElement);
            });

            // ИСПРАВЛЕНО:
            // Проверяем сохранённый ответ на текущий вопрос.
            if (
                chosenOption &&
                chosenOption.chooseAnswerId !== null
            ) {
                this.nextButtonElement.removeAttribute('disabled');
            } else {
                this.nextButtonElement.setAttribute(
                    'disabled',
                    'disabled'
                );
            }

            if (
                this.currentQuestionIndex ===
                this.quiz.questions.length
            ) {
                this.nextButtonElement.innerText = 'Завершить';
            } else {
                this.nextButtonElement.innerText = 'Далее';
            }

            if (this.currentQuestionIndex > 1) {
                this.prevButtonElement.removeAttribute('disabled');
            } else {
                this.prevButtonElement.setAttribute(
                    'disabled',
                    'disabled'
                );
            }
        },

        chooseAnswer() {
            this.nextButtonElement.removeAttribute('disabled');
            if (this.passButtonElement) {
                this.passButtonElement.disabled = true;
            }
        },

        saveCurrentAnswer() {
            const activeQuestion =
                this.quiz.questions[this.currentQuestionIndex - 1];

            if (!activeQuestion) {
                return;
            }

            const chosenAnswer = Array.from(
                this.optionsElement.querySelectorAll('.option-answer')
            ).find(element => element.checked);

            const chooseAnswerId =
                chosenAnswer && chosenAnswer.value
                    ? Number(chosenAnswer.value)
                    : null;

            const existingResult = this.userResult.find(item => {
                return item.questionId === activeQuestion.id;
            });

            if (existingResult) {
                existingResult.chooseAnswerId = chooseAnswerId;
            } else {
                this.userResult.push({
                    questionId: activeQuestion.id,
                    chooseAnswerId: chooseAnswerId
                });
            }
        },

        move(action) {
            if (this.isCompleted) {
                return;
            }

            this.saveCurrentAnswer();

            if (action === 'next' || action === 'pass') {
                this.currentQuestionIndex++;
            } else if (action === 'prev') {
                this.currentQuestionIndex--;
            }

            if (
                this.currentQuestionIndex >
                this.quiz.questions.length
            ) {
                this.complete();
                return;
            }

            if (this.currentQuestionIndex < 1) {
                this.currentQuestionIndex = 1;
            }

            Array.from(
                this.progressBarElement.children
            ).forEach((item, index) => {
                const questionIndex = index + 1;

                item.classList.remove('complete', 'active');

                if (questionIndex === this.currentQuestionIndex) {
                    item.classList.add('active');
                } else if (
                    questionIndex < this.currentQuestionIndex
                ) {
                    item.classList.add('complete');
                }
            });

            this.showQuestion();
        },

        
        
        complete() {
            if (this.isCompleted) {
                return;
            }

            this.isCompleted = true;

            if (this.timerInterval !== null) {
                clearInterval(this.timerInterval);
            }

            this.saveCurrentAnswer();

            const url = new URL(location.href);

            const id = url.searchParams.get('id');
            const name = url.searchParams.get('name');
            const lastName = url.searchParams.get('lastName');
            const email = url.searchParams.get('email');

            if (!id) {
                location.href = 'index.html';
                return;
            }

            const xhr = new XMLHttpRequest();

            xhr.open(
                'POST',
                'https://testologia.ru/pass-quiz?id=' + encodeURIComponent(id),
                true
            );

            xhr.setRequestHeader(
                'Content-Type',
                'application/json; charset=UTF-8'
            );

            xhr.onload = () => {
                try {
                    if (xhr.status !== 200) {
                        throw new Error('Ошибка отправки результатов');
                    }

                    const result = JSON.parse(xhr.responseText);

                    const score = Number(result.score);
                    const total = Number(result.total);

                    if (
                        !Number.isFinite(score) ||
                        !Number.isFinite(total) ||
                        total <= 0 ||
                        score < 0 ||
                        score > total
                    ) {
                        throw new Error('Некорректный результат сервера');
                    }

                    // Сохраняем количество правильных ответов.
                    sessionStorage.setItem('quizScore', score);
                    sessionStorage.setItem('quizTotal', total);

                    // Сохраняем ответы пользователя.
                    sessionStorage.setItem(
                        'userResult',
                        JSON.stringify(this.userResult)
                    );

                    sessionStorage.setItem('quizId', id);
                    sessionStorage.setItem('quizName', this.quiz.name);

                    // Переходим на страницу результатов.
                    const resultUrl = new URL('result.html', location.href);

                    resultUrl.searchParams.set('score', score);
                    resultUrl.searchParams.set('total', total);

                    location.href = resultUrl.href;

                } catch (error) {
                    console.error('Ошибка завершения теста:', error);
                    this.isCompleted = false;
                    location.href = 'index.html';
                }
            };

            xhr.onerror = () => {
                console.error('Ошибка соединения с сервером');
                this.isCompleted = false;
                location.href = 'index.html';
            };

            xhr.send(JSON.stringify({
                name: name,
                lastName: lastName,
                email: email,
                results: this.userResult
            }));
        }


    };

    Test.init();
})();