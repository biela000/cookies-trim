export default class AnimationUtils {
    static fillElementWithBinary(element) {
        const minimumNumber = Math.pow(2, 20);
        const maximumNumber = Math.pow(2, 30);
        let isOverflowing = false;
        let randomNumber = 0;

        while (!isOverflowing) {
            randomNumber = Math.floor(
                Math.random() * (maximumNumber - minimumNumber + 1)
            ) + minimumNumber;
            element.innerHTML += randomNumber.toString(2);
            isOverflowing = element.scrollHeight > element.clientHeight;
        }
        element.innerHTML += randomNumber.toString(2);
    }
}
