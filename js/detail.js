import { deleteIndicator, fetchCountryIndicator, fetchCountryIndicators, fetchIndicatorsByPage, getIndicatorById, getSavedIndicators, saveIndicator } from "./data.js";

const DATA = {
    countryDetails: {},
    countryIndicators: [],
    modal: {
        pagination: {},
        indicatorList: [],
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const countryCode = (new URL(document.location)).searchParams.get('code')
    const fetchedDetails = await fetchCountryIndicators(countryCode, getSavedIndicators());
    [DATA.countryDetails, DATA.countryIndicators] = fetchedDetails

    console.log(DATA.countryDetails, DATA.countryIndicators)
    const $countryName = document.querySelector('#countryName')
    $countryName.innerHTML = `<div class="flagImgWrapper">
    ${DATA.countryDetails.capitalCity ? `<img class="flagImg" src="https://www.countryflagicons.com/FLAT/48/${DATA.countryDetails.iso2Code}.png">`
            : `<span class="material-icons">question_mark</span>`}
            </div>` + DATA.countryDetails.name




    injectIndicators()
    injectCountryData()
    setupLeaflet(DATA.countryDetails.latitude, DATA.countryDetails.longitude)
    assignAllListeners()

});

const assignAllListeners = () => {
    const $goToFavoritesBtn = document.querySelector('#goToFavorites')
    const $goToListOfCountriesBtn = document.querySelector('#goToListOfCountries')
    const $openModal = document.querySelector('#addIndicators')
    const $closeModalBtn = document.querySelector('#closeModal')
    const $modal = document.querySelector('.modal')
    const $loadMoreCountriesBtn = document.querySelector('#loadMoreCountries')
    const $searchbarForm = document.querySelector('#searchbarForm')


    $loadMoreCountriesBtn.addEventListener('click', async () => {
        const moreIndicators = await fetchIndicatorsByPage(DATA.modal.pagination.page)
        console.log(moreIndicators)
        DATA.modal.pagination = moreIndicators[0]
        DATA.modal.indicatorList = [...DATA.modal.indicatorList, ...moreIndicators[1]]
        injectRowsToModalTable()

        if (DATA.modal.pagination.page === moreIndicators[0].pages) {
            $loadMoreCountriesBtn.style.display = 'none'
            return
        }
    })

    $goToFavoritesBtn.addEventListener('click', async () => {
        window.location = 'favorites.html'
    })

    $goToListOfCountriesBtn.addEventListener('click', async () => {
        window.location = './'
    })

    $openModal.addEventListener('click', async () => {
        $modal.classList.add('modal-open')
        if (DATA.modal.indicatorList.length === 0) {
            [DATA.modal.pagination, DATA.modal.indicatorList] = await fetchIndicatorsByPage(1)
            injectRowsToModalTable()
        } else {
            injectRowsToModalTable()
        }
    })

    $closeModalBtn.addEventListener('click', async () => {
        $modal.classList.remove('modal-open')
    })

    $searchbarForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const searchWord = $searchbarForm.elements['search'].value;
        window.location = '/?searchword=' + searchWord
    });
}

const setupLeaflet = (latitude, longitude) => {
    const map = L.map('map').setView([latitude, longitude], 5);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);
}

const injectRowsToModalTable = () => {
    const $table = document.querySelector('#modalTable')
    const $modal = document.querySelector('.modal')

    const dataToPrint = DATA.modal.indicatorList

    const tableHeader = `
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Source Note</th>
        </tr>`

    const stringOfDataToPrint = tableHeader + dataToPrint.map((indicator) => {
        return `
                <tr class="modalTableRow" data-code="${indicator.id}">
                    <td>${indicator.id}</td>
                    <td>${indicator.name}</td>
                    <td>${indicator.sourceNote}</td>
                </tr>
            `
    }).join('')

    $table.innerHTML = stringOfDataToPrint

    Array.from(document.querySelectorAll(".modalTableRow")).map(($rowElem) => {
        $rowElem.style.cursor = 'pointer'
        $rowElem.addEventListener('click', async (e) => {
            const selectedIndicator = await fetchCountryIndicator(DATA.countryDetails.iso2Code, $rowElem.dataset.code)
            if (selectedIndicator) {
                saveIndicator($rowElem.dataset.code)
                DATA.countryIndicators.push(selectedIndicator)
                injectIndicators()
                $modal.classList.remove('modal-open')
            } else {
                $rowElem.style.backgroundColor = "darkgrey"
            }
        })
    })

}

const injectCountryData = () => {
    const $wrapper = document.querySelector('#countryBasicData')

    $wrapper.innerHTML = `
        <p><b>Name</b></p>
        <p>${DATA.countryDetails.name}</p>` + ((DATA.countryDetails.capitalCity != "") ? `
        <p><b>Capital</b></p>
        <p>${DATA.countryDetails.capitalCity}</p>` : ``) +
        `<p><b>Region</b></p>
        <p>${DATA.countryDetails?.region.value}</p>
    `
}

const injectIndicators = () => {
    const $wrapper = document.querySelector('#indicators-wrapper')

    const stringOfDataToPrint = DATA.countryIndicators.map((indicator) => {
        return `
        <div class="indicator" data-indicator=${indicator.indicator.id}>
            <p><b>${indicator.indicator.value}</b></p>
            <p><i>(${indicator.date})</i></p>
            <p>${indicator.value}</p>
            <button class="deleteBtn">Delete</button>
        </div>
        `
    }).join('')

    $wrapper.innerHTML = stringOfDataToPrint

    Array.from(document.querySelectorAll(".indicator")).map(($indicator) => {
        const indicatorId = $indicator.dataset.indicator;

        $indicator.querySelector('.deleteBtn').addEventListener('click', async (e) => {
            e.preventDefault()
            console.log('works')
            deleteIndicator(indicatorId)
            DATA.countryIndicators = DATA.countryIndicators.filter(indicator => indicator.indicator.id !== indicatorId)
            console.log(DATA.countryIndicators, indicatorId)
            injectIndicators()

        })
    })
}
