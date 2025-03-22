function Errors() { 

    let nameField = document.getElementById('field1') 
    let emailField = document.getElementById('field2') 
    let phoneField = document.getElementById('field3') 
    let messageField = document.getElementById('field4')   

    let fieldBox = document.querySelectorAll('.input-box input, .input-box textarea')

    let err  = document.getElementById('error-message')

    let fields = [nameField, emailField, phoneField, messageField]
    fields.forEach((item) => {
        if(item.value == '') {
            err.innerHTML = 'Не все поля заполнены'
            err.style.color = 'red'
            item.style.border = '2px solid red';
        }
        else if(!emailField.value.includes('@')) {
            err.innerHTML = 'Не хватает символа @'
            err.style.color = 'red'
            item.style.border = '2px solid red';
        }
        else if(messageField.value.length < 5) {
            err.innerHTML = 'Сообщение должно быть больше 5 символов'
            err.style.color = 'red'
            item.style.border = '2px solid red';
        }
        else if(messageField.value.length > 50) {
            err.innerHTML = 'Сообщение должно быть меньше 50 символов'
            err.style.color = 'red'
            item.style.border = '2px solid red';
        }
        else {
            err.innerHTML = 'Все успешно'
            err.style.color = 'green'
            fieldBox.forEach((item) => {
                item.style.border = '2px solid green';
            })
        }
})
}

function toggleMenu() {
    const menuLinks = document.querySelector('.menu-links');
    menuLinks.classList.toggle('activeon'); 
}