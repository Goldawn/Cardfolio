const saveData = (key, value) => {
    if(localStorage){
        localStorage.setItem(key, value);
    }else {
        alert("Web Storage is not supported");
    }
}

const loadData = (key) => {
    if(localStorage){
        if(key in localStorage) {
            return localStorage.getItem(key);
        }
        } else {
        alert("Web Storage is not supported");
    }
}

const deleteData = (key) => {
    if(localStorage){
        if(key in localStorage) {
            return localStorage.removeItem(key);
        }
        } else {
        alert("Web Storage is not supported");
    }
}


export { saveData, loadData, deleteData };