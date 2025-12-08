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


async function copy_text_to_clipboard(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
        return navigator.clipboard.writeText(text);
    }

    // fallback for browsers without navigator.clipboard support
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    return new Promise((resolve, reject) => {
        try {
            const successful = document.execCommand("copy");
            document.body.removeChild(textarea);
            if(successful){
                resolve();
            } else {
                reject(new Error("Copy command was unsuccessful"));
            }
        } catch(err){
            document.body.removeChild(textarea);
            reject(err);
        }
    });
}

function normalize_input_value(input){
    if(!input){
        return null;
    }
    const fallback = input.defaultValue ?? input.value ?? "0";
    return read_input(input.id, fallback);
}

export function build_config_string(configIds){
    const values = configIds
        .map((id) => normalize_input_value(document.getElementById(id)))
        .filter((value) => value !== null && value !== undefined && value !== "");
    return values.join("-");
}

export function attach_config_exporter(buttonId, configIds, statusElementId){
    const exportButton = document.getElementById(buttonId);
    if(!exportButton){
        return;
    }

    const statusElement = statusElementId ? document.getElementById(statusElementId) : null;
    let statusTimeout;

    exportButton.addEventListener("click", async () => {
        const configString = build_config_string(configIds);
        try {
            await copy_text_to_clipboard(configString);
            if(statusElement){
                if(statusTimeout){
                    clearTimeout(statusTimeout);
                }
                statusElement.classList.remove("error");
                statusElement.classList.add("success");
                statusElement.textContent = "Export successful";
                statusElement.style.visibility = "visible";
                statusTimeout = setTimeout(() => {
                    statusElement.textContent = "";
                    statusElement.classList.remove("success");
                    statusElement.style.visibility = "hidden";
                    statusTimeout = null;
                }, 2000);
            }
        } catch(err){
            if(statusElement){
                statusElement.classList.remove("success");
                statusElement.classList.add("error");
                statusElement.textContent = "Failed to copy config to clipboard.";
                statusElement.style.visibility = "visible";
            }
        }
    });
}