const cartProds = document.getElementById('cart-prods')
const totalPriceElement = document.getElementById('total-price')
const clearCart = document.getElementById('clear-cart')

const cart = JSON.parse(localStorage.getItem('cart')) || []
let totalPrice = 0

if(cart.length == 0) {
    cartProds.innerHTML = `<p class ='empty'>Корзина пуста</p>`
}
else {
    cart.forEach((item) => {
        const itemElement = document.createElement('div')
        itemElement.classList.add('cart-products')

        itemElement.innerHTML = `
        <div class = 'prod-line'></div>
        <div class = 'cart-prods'>
            <div class = 'cart-prod'>
                <img src = "${item.image}">
            </div>
            <p class = 'prod-name'>${item.name}<p>
            <p class = 'prod-price'> ${item.price} руб<p>
        </div>
        <div class = 'prod-line'></div>`

        cartProds.appendChild(itemElement)

        totalPrice += item.price
        
    })
}
console.log(totalPrice)
totalPriceElement.textContent = `Итого: ${totalPrice} руб`

clearCart.addEventListener('click', () => {
    localStorage.removeItem('cart')
    alert('Корзина очищена!')
    window.location.reload()
})