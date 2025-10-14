export function read_input(id, fallback){
    const input = document.getElementById(id);
    if (!input){
        return fallback; // no input field? just return fallback already
    }

    const min = input.getAttribute("min");
    const max = input.getAttribute("max");
    const raw_input = +input.value;
    if (!input.value){
        return fallback;
    }
    if (raw_input < min){
        return min;
    }
    if (raw_input > max){

        return max;
    }
    return input.value;

}

export function compress_dataset(dataset, approx_length){
    if (dataset.length < (approx_length * 2)){
        return dataset;
    }
    const compression_factor = get_compression_factor(dataset, approx_length);

    let compressed_dataset = [];
    const chunks = Math.floor(dataset.length/compression_factor);

    for(let i = 0; i < chunks; i++){
        let chunk = dataset.slice(i*compression_factor, (i+1)*compression_factor);
        let sum = chunk.reduce((a,b) => a + b)

        compressed_dataset.push(sum / chunk.length);
    }
    
    if(dataset.length % compression_factor != 0){
        let last_chunk = dataset.slice(chunks*compression_factor);
        compressed_dataset.push((last_chunk.reduce((a,b) => a + b))/last_chunk.length);
    }

    return compressed_dataset;
}
export function get_compression_factor(dataset, approx_length){
    if (dataset.length < approx_length * 2){
        return 1; // 0 prevention, though this may not be the best way to implement it... this will work though
    }
    return Math.floor(dataset.length / approx_length);
}

