/* 
            <=========  Komunikacia s API    =========>
*/

//Funkcia ktora fetchne z API krajiny zodpovedajuce page -> API ma vstavanu paginaciu
export const fetchCountriesByPage = async (page) => {
    let fetchedData = []

    await fetch(`https://api.worldbank.org/v2/country?format=json&page=${page}`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)

    return fetchedData
}

//Funkcia ktora fetchne z API indikatory zodpovedajuce page -> API ma vstavanu paginaciu
export const fetchIndicatorsByPage = async (page) => {
    let fetchedData = []

    await fetch(`https://api.worldbank.org/v2/indicator?format=json&page=${page}`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)

    return fetchedData
}

//Funkcia ktora na zaklade kodu krajiny ziska z API spat podrobne data o nej
const fetchCountryData = async (code) => {
    let fetchedData = []
    await fetch(`https://api.worldbank.org/v2/country/${code}?format=json`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)
    return fetchedData[1][0]
}

//Funkcia ktora na zaklade kodu krajiny a ID indikatora ziska z API spat indikator
export const fetchCountryIndicator = async (countryCode, indicatorId) => {
    let fetchedData = []
    await fetch(`https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorId}?format=json`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)

    if (fetchedData[1]) {
        return fetchedData[1][0]
    }

    return false
}

//Funkcia ktora na zaklade kodu krajiny a array ID indikatorov ziska z API, podrobnosti krajiny a list indikatorov
export const fetchCountryIndicators = async (code, indicatorCodes) => {
    const [countryData, ...indicators] = await Promise.all([
        fetchCountryData(code),
        ...indicatorCodes.map(indicator => fetchCountryIndicator(code, indicator))
    ])
    return [countryData, indicators]
}

//Funkcia ktora si stiahne vsetky krajiny a prefiltruje ci sa v nich vyskytuje nase search query, a vracia
//zoznam krajin ktore odpovedaju query
export const fetchCountriesByQuery = async (query) => {
    const allCountries = await fetch(`https://api.worldbank.org/v2/country/all?format=json&per_page=300`)
        .then(response => { return response.json() })
        .then(data => { return data })
        .catch(err => console.log(err))

    const filteredResults = allCountries[1]
        .filter((country) => (country.name.toLowerCase().includes(query) ||
            country.capitalCity.toLowerCase().includes(query) || country.iso2Code.toLowerCase().includes(query)))
    return filteredResults
}

/* 
            <=========  Manipulacia dat    =========>
*/

//Funkcia ktora odstrani z array vsetky regiony (nemaju hlavne mesto)
export const parseToOnlyCountries = (resultsArray) => {
    return resultsArray.filter((country) => country.capitalCity !== '')
}

//Funkcia ktora vrati objekt krajiny na zaklade kodu krajiny
export const getCountryByCode = (countryArray, code) => {
    return countryArray.find((country) => country.iso2Code === code)
}

//Funkcia ktora vrati objekt indikatora na zaklade id indikatora
export const getIndicatorById = (indicatorArray, id) => {
    return indicatorArray.find((indicator) => indicator.id === id)
}

//Funkcia ktora do zoznamu oblubenych krajin v LS vlozi ku krajine s kodom code poznamku note
export const addNoteToSavedCountry = (code, note) => {
    const arrFromLocalStorage = JSON.parse(window.localStorage.favoriteCountries)

    if (!arrFromLocalStorage) return

    arrFromLocalStorage.forEach((country) => { if (country.iso2Code == code) country.notes = note })
    window.localStorage.favoriteCountries = JSON.stringify(arrFromLocalStorage)
}

//Funkcia ktora ulozi krajinu do zoznamu oblubenych krajin v LS
export const saveCountryToFavourites = (country) => {
    const countryToSave = { ...country, notes: '' }
    const savedCountries = window.localStorage.favoriteCountries

    if (savedCountries) {
        const arrFromLocalStorage = JSON.parse(savedCountries)
        if (arrFromLocalStorage.find((lsCountry) => lsCountry.iso2Code === countryToSave.iso2Code)) return
        arrFromLocalStorage.push(countryToSave)
        window.localStorage.favoriteCountries = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteCountries = JSON.stringify([countryToSave])
    }

}

//Funkcia ktora ulozi indikator do zoznamu oblubenych indikatorov v LS
export const saveIndicator = (indicator) => {
    const savedIndicators = window.localStorage.favoriteIndicators

    if (savedIndicators) {
        const arrFromLocalStorage = JSON.parse(savedIndicators)
        if (arrFromLocalStorage.find((lsIndicator) => lsIndicator === indicator)) return
        arrFromLocalStorage.push(indicator)
        window.localStorage.favoriteIndicators = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteIndicators = JSON.stringify([indicator])
    }

}

//Funkcia ktora zmaze krajinu zo zoznamu oblubenych krajin v LS
export const deleteCountryFromFavorites = (code) => {
    const savedCountries = window.localStorage.favoriteCountries
    if (savedCountries) {
        const arrFromLocalStorage = JSON.parse(savedCountries).filter((lsCountry) => lsCountry.iso2Code !== code)
        window.localStorage.favoriteCountries = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteCountries = JSON.stringify([])
    }
}

//Funkcia ktora zmaze indikator zo zoznamu oblubenych indikatorov v LS
export const deleteIndicator = (indicator) => {
    const savedIndicators = window.localStorage.favoriteIndicators
    if (savedIndicators) {
        const arrFromLocalStorage = JSON.parse(savedIndicators).filter((lsIndicator) => lsIndicator !== indicator)
        window.localStorage.favoriteIndicators = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteIndicators = JSON.stringify([])
    }
}

//Funkcia ktora vrati zoznam oblubenych krajin v LS
export const getSavedFavoriteCountries = () => {
    const savedCountries = window.localStorage.favoriteCountries

    if (!savedCountries) {
        return []
    }

    return JSON.parse(savedCountries)
}

//Funkcia ktora vrati kody oblubenych krajin v LS
export const getSavedFavoriteCountriesCodes = () => {
    const savedCountries = window.localStorage.favoriteCountries

    if (!savedCountries) {
        return []
    }

    return JSON.parse(savedCountries).map((country) => country.iso2Code)
}

//Funkcia ktora vrati zoznam oblubenych indikatorov v LS
export const getSavedIndicators = () => {
    const savedIndicators = window.localStorage.favoriteIndicators

    if (!savedIndicators) {
        const defaultIndicators = [
            'NY.GDP.MKTP.CD', 'NE.EXP.GNFS.ZS', 'NY.GDP.PCAP.CD', 'NY.GDP.MKTP.KD.ZG', 'FP.CPI.TOTL.ZG'
        ]
        window.localStorage.favoriteIndicators = JSON.stringify(defaultIndicators);
        return defaultIndicators
    }

    return JSON.parse(savedIndicators)
}