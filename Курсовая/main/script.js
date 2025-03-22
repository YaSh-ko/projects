let slides = document.querySelectorAll('.dis-slide')
let currrentIndex = 0

function changeSlide() {
    slides[currrentIndex].classList.remove('active')

    currrentIndex = (currrentIndex + 1) % slides.length

    slides[currrentIndex].classList.add('active')
}

function prevSlide() {
    slides[currrentIndex].classList.remove('active'); 

    
    currrentIndex= (currrentIndex - 1 + slides.length) % slides.length;

    slides[currrentIndex].classList.add('active'); 
}

document.getElementById('nextSlide').addEventListener('click', changeSlide);
document.getElementById('prevSlide').addEventListener('click', prevSlide);

setInterval(changeSlide, 10000)

slides[currrentIndex].classList.add('active')






const targetDate = new Date()
targetDate.setDate(targetDate.getDate() + 1)

function updateTimer() {
    let now = new Date();
    let timeRemaining = targetDate - now

    if(timeRemaining <= 0 ) {
        document.getElementById('timer').textContent = 'Время вышло'
        clearInterval(interval)
        return
    }

    let hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    document.getElementById('timer').textContent = `${hours}:${minutes}:${seconds} `

}

const interval = setInterval(updateTimer, 1000)
updateTimer()

function toggleMenu() {
    const menuLinks = document.querySelector('.menu-links');
    menuLinks.classList.toggle('activeon'); 
}





































