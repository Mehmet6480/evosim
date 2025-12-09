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
function show_status(statusElement, type, message){
    if(!statusElement){
        return;
    }
    statusElement.classList.remove("success", "error");
    if(type){
        statusElement.classList.add(type);
    }
    statusElement.textContent = message;
    statusElement.style.visibility = message ? "visible" : "hidden";
}

function create_status_manager(statusElement){
    let statusTimeout;

    const clear_status = () => {
        show_status(statusElement, "", "");
        statusTimeout = null;
    };

    return {
        show(type, message, autoClear = true){
            if(!statusElement){
                return;
            }

            if(statusTimeout){
                clearTimeout(statusTimeout);
                statusTimeout = null;
            }

            show_status(statusElement, type, message);

            if(autoClear && message){
                statusTimeout = setTimeout(clear_status, 2000);
            }
        },
        clear(){
            if(statusTimeout){
                clearTimeout(statusTimeout);
                statusTimeout = null;
            }
            clear_status();
        }
    };
}
export function attach_config_exporter(buttonId, configIds, statusElementId){
    const exportButton = document.getElementById(buttonId);
    if(!exportButton){
        return;
    }

    const statusElement = statusElementId ? document.getElementById(statusElementId) : null;
    const statusManager = create_status_manager(statusElement);

    exportButton.addEventListener("click", async () => {
        const configString = build_config_string(configIds);
        try {
            await copy_text_to_clipboard(configString);
            statusManager.show("success", "Export successful");
        } catch(err){
            statusManager.show("error", "Failed to copy config to clipboard.", false);
        }
    });
}

export function attach_config_importer(buttonId, inputId, configIds, statusElementId){
    const importButton = document.getElementById(buttonId);
    const inputElement = document.getElementById(inputId);
    if(!importButton || !inputElement){
        return;
    }

    const statusElement = statusElementId ? document.getElementById(statusElementId) : null;
    const statusManager = create_status_manager(statusElement);

    importButton.addEventListener("click", () => {
        const rawValue = inputElement.value.trim();
        const parts = rawValue.split("-");
        const inputs = configIds.map((id) => document.getElementById(id));

        const allPartsPresent =
            parts.length === configIds.length && parts.every((p) => p !== "");
        if(!allPartsPresent){
            statusManager.show("error", "Invalid config format.");            
            return;
        }

        const hasInvalidValue = parts.some((part, idx) => {
            const input = inputs[idx];
            const numeric = Number(part);
            if(!Number.isFinite(numeric)){
                return true;
            }
            if(!input){
                return false;
            }

            const min = input.getAttribute("min");
            const max = input.getAttribute("max");

            if(min !== null && min !== "" && numeric < Number(min)){
                return true;
            }
            if(max !== null && max !== "" && numeric > Number(max)){
                return true;
            }
            return false;
        });

        if(hasInvalidValue){
            statusManager.show("error", "Invalid input values.");
            return;
        }

        inputs.forEach((input, idx) => {
            if(input){
                input.value = parts[idx];
                input.dispatchEvent(new Event("input", { bubbles: true }));
            }
        });

        statusManager.show("success", "Import successful.");
    });
}