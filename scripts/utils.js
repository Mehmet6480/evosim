export function read_input(id, fallback){
    const input = document.getElementById(id);
    if (!input){
        return fallback; // no input field? just return fallback already
    }

    const min = input.getAttribute("min");
    const max = input.getAttribute("max");
    const raw_input = input.value;
    if (!input.value){
        return fallback;
    }
    if (raw_input < min){
        return min;
    }
    if (raw_input > max){
        console.log(max/raw_input);  
        return max;
    }
    return input.value;

}
