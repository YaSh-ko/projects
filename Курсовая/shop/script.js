document.querySelectorAll('.slider-container').forEach((slider) => {
    const products = slider.querySelector('.products');
    const prevButton = slider.querySelector('.prev-button');
    const nextButton = slider.querySelector('.next-button');

    let currentOffset = 0;
    const productWidth = 360; // Ширина одного продукта (включая gap)
    const visibleCount = 4; // Количество видимых продуктов
    const totalProducts = products.children.length; // Общее количество продуктов
    const maxOffset = -(totalProducts - visibleCount) * productWidth;

    nextButton.addEventListener('click', () => {
        if (currentOffset > maxOffset) {
            currentOffset -= productWidth;
            products.style.transform = `translateX(${currentOffset}px)`;
        }
    });

    prevButton.addEventListener('click', () => {
        if (currentOffset < 0) {
            currentOffset += productWidth;
            products.style.transform = `translateX(${currentOffset}px)`;
        }
    });
});


const shop = document.querySelectorAll('.prods');
let count = 0
shop.forEach((item) => {
    item.addEventListener('click', (event) => {
        const prod = event.target.closest('.prod'); 
        if (prod) {

            
            count += 1
            const ord = document.querySelector('.num-ord')
            ord.classList.add('active')
            ord.textContent = count
            const prodName = prod.getAttribute('data-name');  
            const prodPrice = parseInt(prod.getAttribute('data-price')); 
            const prodImage = prod.getAttribute('data-image'); 

            
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');

            cart.push({ name: prodName, price: prodPrice, image: prodImage });

            localStorage.setItem('cart', JSON.stringify(cart));
        }
    });
});



document.querySelectorAll('.prod').forEach(item => {
    item.addEventListener('click', (event) => {

        let clone = item.cloneNode(true)
        clone.classList.add('clone')
        document.body.appendChild(clone)

        let rect = item.getBoundingClientRect();
        let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        clone.style.left = (rect.left + scrollLeft) + 'px';
        clone.style.top = (rect.top + scrollTop) + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';

        clone.addEventListener('animationend', () => {
            document.body.removeChild(clone)
        });
    });
});

