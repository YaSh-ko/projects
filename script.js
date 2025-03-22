document.getElementById('travelForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        from: document.querySelector('input[name="from"]').value.trim(),
        to: document.querySelector('input[name="to"]').value.trim(),
        date: document.querySelector('input[name="date"]').value.trim(),
        filter: document.getElementById('filter').value
    };

    console.log('Отправляемые данные:', formData);
    const resultDiv = document.getElementById('result');

    resultDiv.style.textAlign = "center";
    resultDiv.style.fontSize = '18px';
    resultDiv.innerHTML = `<span>Ща посмотрю по картам...</span>`;
    
    try {
        const response = await fetch('http://yashak24.beget.tech/api/chemp.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        console.log('Ответ от сервера:', result);
        if (response.ok) {
            if (result.routes && result.routes.segments && Array.isArray(result.routes.segments)) {
                let output = '';

                result.routes.segments.forEach((segment, index) => {
                    output += `
                        <div class="route-container">
                            <h3 class="route-title">Маршрут ${index + 1}</h3>
                            <div class="transfers-info">
                                ${segment.has_transfers ? 
                                    '<span class="has-transfers">Есть пересадки</span>' : 
                                    '<span class="no-transfers">Без пересадок</span>'}
                            </div>`;

                    let fromTitle = 'Неизвестно';
                    let toTitle = 'Неизвестно';
                    if (segment.details && Array.isArray(segment.details)) {
                        if (segment.details[0]?.from?.title) {
                            fromTitle = segment.details[0].from.title;
                        }
                        if (segment.details[segment.details.length - 1]?.to?.title) {
                            toTitle = segment.details[segment.details.length - 1].to.title;
                        }
                    } else {
                        if (segment.from?.title) fromTitle = segment.from.title;
                        if (segment.to?.title) toTitle = segment.to.title;

                    }
                    output += `
                        <div class="route-path">
                            <strong>От:</strong> ${fromTitle} → <strong>До:</strong> ${toTitle}
                        </div>
                        <div class="route-times">
                            <strong>Отправление:</strong> ${segment.departure || 'Неизвестно'} 
                            | <strong>Прибытие:</strong> ${segment.arrival || 'Неизвестно'}
                        </div>`;

                    let transportType = 'Не указано';
                    if (segment.transport_types && Array.isArray(segment.transport_types)) {
                        transportType = segment.transport_types.join(', ');
                    } else if (segment.thread?.transport_type) {
                        transportType = segment.thread.transport_type;
                    }
                    output += `
                        <div class="transport-type">
                            <strong>Тип транспорта:</strong> ${transportType}
                        </div>`;
                        
                    // Добавляем вывод цены
                    let price = segment.calculated_price ? `${segment.calculated_price} ₽` : 'Цена не указана';
                    output += `
                        <div class="route-price">
                            <strong>Цена:</strong> ${price}
                        </div>`;

                    let totalDuration = segment.duration || 0;

                    if (segment.details && Array.isArray(segment.details)) {
                        output += `
                            <div class="route-details">
                                <strong>Этапы маршрута:</strong>
                                <div class="details-list">`;
                        segment.details.forEach((detail, detailIndex) => {
                            if (detail.is_transfer) {
                                const transferFrom = detail.transfer_from?.title || 'Неизвестно';
                                const transferTo = detail.transfer_to?.title || 'Неизвестно';
                                const transferDuration = detail.duration || 0;
                                totalDuration += transferDuration;
                                output += `
                                    <div class="transfer-info">
                                        Пересадка ${detailIndex}: ${transferFrom} → ${transferTo} 
                                        (ожидание: ${Math.floor(transferDuration / 3600)} ч ${Math.floor((transferDuration % 3600) / 60)} мин)
                                    </div>`;
                            } else {
                                const stageFrom = detail.from?.title || 'Неизвестно';
                                const stageTo = detail.to?.title || 'Неизвестно';
                                const stageDeparture = detail.departure || 'Неизвестно';
                                const stageArrival = detail.arrival || 'Неизвестно';
                                const stageDuration = detail.duration || 0;
                                totalDuration += stageDuration;
                                const stageThread = detail.thread?.title || 'Неизвестный рейс';
                                output += `
                                    <div class="stage-info">
                                        <strong>Этап ${detailIndex + 1}:</strong> ${stageFrom} → ${stageTo} 
                                        (рейс: ${stageThread})<br>
                                        Отправление: ${stageDeparture}, Прибытие: ${stageArrival}, 
                                        Длительность: ${Math.floor(stageDuration / 3600)} ч ${Math.floor((stageDuration % 3600) / 60)} мин
                                    </div>`;
                            }
                        });
                        output += `</div></div>`;
                    }

                    output += `
                        <div class="total-duration">
                            <strong>Общая длительность:</strong> 
                            ${Math.floor(totalDuration / 3600)} ч ${Math.floor((totalDuration % 3600) / 60)} мин
                        </div>
                    </div>`;
                });

                if (result.copyright) {
                
                    output += `
                        <div class="copyright-container">
                            <h3>Копирайт Яндекс.Расписаний</h3>
                            <p><strong>Текст:</strong> ${result.copyright.text || 'Данные предоставлены сервисом Яндекс Расписания'}</p>
                            <p><strong>URL:</strong> <a href="${result.copyright.url || 'http://rasp.yandex.ru/'}" target="_blank">
                                ${result.copyright.url || 'http://rasp.yandex.ru/'}
                            </a></p>
                            ${result.copyright.logo_vy && result.copyright.logo_vy.trim() !== '' 
                                ? `<div class="banner-iframe">${result.copyright.logo_vy}</div>`
                                : '<p>Баннер не доступен</p>'}
                        </div>`;
                }
                
                

                resultDiv.style.textAlign = 'start'
                resultDiv.innerHTML = output || 'Маршруты не найдены';
            } else {
                console.error('Поле routes.segments отсутствует или не является массивом:', result);
                resultDiv.style.textAlign = 'start'
                resultDiv.textContent = 'Ошибка: Некорректный формат данных';
            }
        } else {
            console.error('Ошибка сервера:', result.error);
            resultDiv.style.textAlign = 'start'
            resultDiv.textContent = 'Ошибка: ' + (result.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        console.error('Ошибка:', error.message);
        resultDiv.style.textAlign = 'start'
        resultDiv.textContent = 'Ошибка: ' + error.message;
    }
});

document.getElementById('swapButton').addEventListener('click', function () {
    // Получаем значения полей "Откуда" и "Куда"
    const fromInput = document.querySelector('input[name="from"]');
    const toInput = document.querySelector('input[name="to"]');

    // Меняем значения местами
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
});
