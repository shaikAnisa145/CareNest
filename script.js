/* =====================================================
   CARENEST
   GOOGLE NEARBY HEALTHCARE + APPOINTMENTS
===================================================== */


/* =====================================================
   GOOGLE API KEY

   IMPORTANT:
   Replace the text below with your Google Places API key.

   Example:
   const GOOGLE_API_KEY = "AIza....";

===================================================== */

const GOOGLE_API_KEY = "AIzaSyCho28fmgKIcGSSt63SNwkwyN77Zw21KY4";

/* =====================================================
   GLOBAL DATA
===================================================== */

let currentLatitude = null;
let currentLongitude = null;

let hospitals = [];
let doctors = [];

let selectedDoctor = null;


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    setMinimumDate();

    loadAppointments();

});


/* =====================================================
   GET USER LOCATION
===================================================== */

function findNearbyPlaces() {

    const status =
        document.getElementById("locationStatus");

    const message =
        document.getElementById("locationMessage");


    if (GOOGLE_API_KEY === "YOUR_GOOGLE_PLACES_API_KEY") {

        status.innerHTML =
            "Google Places API key required";

        message.innerHTML =
            "Add your Google Places API key in script.js first.";

        alert(
            "Please add your Google Places API key in script.js."
        );

        return;
    }


    if (!navigator.geolocation) {

        status.innerHTML =
            "Location is not supported";

        message.innerHTML =
            "Your browser does not support location services.";

        return;
    }


    status.innerHTML =
        "Getting your location...";

    message.innerHTML =
        "Please allow location access in your browser.";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            currentLatitude =
                position.coords.latitude;

            currentLongitude =
                position.coords.longitude;


            status.innerHTML =
                "Location found ✓";

            message.innerHTML =
                "Searching nearby hospitals and doctors...";


            searchHospitals();

            searchDoctors();

        },

        function (error) {

            console.error(error);


            status.innerHTML =
                "Location access needed";


            message.innerHTML =
                "Please allow location permission and try again.";


            alert(
                "Please allow location access and click My Location again."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}


/* =====================================================
   GOOGLE PLACES REQUEST
===================================================== */

async function googleNearbySearch(types) {

    const url =
        "https://places.googleapis.com/v1/places:searchNearby";


    const body = {

        includedTypes: types,

        maxResultCount: 20,

        rankPreference: "DISTANCE",

        locationRestriction: {

            circle: {

                center: {

                    latitude: currentLatitude,

                    longitude: currentLongitude

                },

                radius: 10000

            }

        }

    };


    const response = await fetch(url, {

        method: "POST",

        headers: {

            "Content-Type":
                "application/json",

            "X-Goog-Api-Key":
                GOOGLE_API_KEY,

            "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.googleMapsUri,places.primaryType"

        },

        body: JSON.stringify(body)

    });


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(errorText);

        throw new Error(
            "Google Places request failed"
        );

    }


    return await response.json();

}


/* =====================================================
   SEARCH HOSPITALS
===================================================== */

async function searchHospitals() {

    const container =
        document.getElementById("hospitalResults");


    container.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">

                <i class="fa-solid fa-spinner fa-spin"></i>

            </div>

            <h3>Finding nearby hospitals...</h3>

            <p>
                Searching Google Places for hospitals
                near your location.
            </p>

        </div>

    `;


    try {

        const data =
            await googleNearbySearch([

                "hospital",
                "general_hospital"

            ]);


        hospitals =
            data.places || [];


        displayHospitals();


    }
    catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>Unable to load hospitals</h3>

                <p>
                    Please check your Google Places API
                    configuration and internet connection.
                </p>

            </div>

        `;

    }

}


/* =====================================================
   DISPLAY HOSPITALS
===================================================== */

function displayHospitals() {

    const container =
        document.getElementById("hospitalResults");


    if (hospitals.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-hospital"></i>

                </div>

                <h3>No nearby hospitals found</h3>

                <p>
                    Try searching again from another location.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    hospitals.forEach(function (hospital) {

        const name =
            hospital.displayName?.text ||
            "Hospital";


        const address =
            hospital.formattedAddress ||
            "Address unavailable";


        const rating =
            hospital.rating
                ? `⭐ ${hospital.rating}`
                : "Rating unavailable";


        const distance =
            getDistanceFromUser(
                hospital.location?.latitude,
                hospital.location?.longitude
            );


        const card =
            document.createElement("div");


        card.className =
            "place-card";


        card.innerHTML = `

            <div class="place-top">

                <div class="place-icon">

                    <i class="fa-solid fa-hospital"></i>

                </div>

                <div class="place-info">

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                    <div class="place-type">
                        Hospital
                    </div>

                </div>

            </div>


            <div class="place-details">

                <p>
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHTML(address)}
                </p>

                <p class="rating">
                    ${rating}
                </p>

                <p>
                    <i class="fa-solid fa-route"></i>
                    ${distance}
                </p>

            </div>


            <div class="card-actions">

                <button
                    class="map-btn"
                    onclick="openGoogleMaps('${hospital.googleMapsUri || ""}')">

                    <i class="fa-solid fa-map-location-dot"></i>
                    View Map

                </button>


                <button
                    class="book-btn"
                    onclick="bookHospital('${hospital.id}')">

                    <i class="fa-solid fa-calendar-check"></i>
                    Book

                </button>

            </div>

        `;


        container.appendChild(card);

    });

}


/* =====================================================
   SEARCH DOCTORS
===================================================== */

async function searchDoctors() {

    const container =
        document.getElementById("doctorResults");


    container.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon doctor-color">

                <i class="fa-solid fa-spinner fa-spin"></i>

            </div>

            <h3>Finding nearby doctors...</h3>

            <p>
                Searching Google Places for healthcare
                professionals near your location.
            </p>

        </div>

    `;


    try {

        const data =
            await googleNearbySearch([

                "doctor"

            ]);


        doctors =
            data.places || [];


        displayDoctors();

    }
    catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon doctor-color">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h3>Unable to load doctors</h3>

                <p>
                    Please check your Google Places API
                    configuration and try again.
                </p>

            </div>

        `;

    }

}


/* =====================================================
   DISPLAY DOCTORS
===================================================== */

function displayDoctors() {

    const container =
        document.getElementById("doctorResults");


    if (doctors.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon doctor-color">

                    <i class="fa-solid fa-user-doctor"></i>

                </div>

                <h3>No doctor listings found</h3>

                <p>
                    Google Places did not return doctor
                    listings near this location.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    doctors.forEach(function (doctor) {

        const name =
            doctor.displayName?.text ||
            "Doctor";


        const address =
            doctor.formattedAddress ||
            "Address unavailable";


        const rating =
            doctor.rating
                ? `⭐ ${doctor.rating}`
                : "Rating unavailable";


        const distance =
            getDistanceFromUser(
                doctor.location?.latitude,
                doctor.location?.longitude
            );


        const card =
            document.createElement("div");


        card.className =
            "place-card doctor-card";


        card.innerHTML = `

            <div class="place-top">

                <div class="place-icon">

                    <i class="fa-solid fa-user-doctor"></i>

                </div>

                <div class="place-info">

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                    <div class="place-type">
                        Doctor / Healthcare Provider
                    </div>

                </div>

            </div>


            <div class="place-details">

                <p>
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHTML(address)}
                </p>

                <p class="rating">
                    ${rating}
                </p>

                <p>
                    <i class="fa-solid fa-route"></i>
                    ${distance}
                </p>

            </div>


            <div class="card-actions">

                <button
                    class="map-btn"
                    onclick="openGoogleMaps('${doctor.googleMapsUri || ""}')">

                    <i class="fa-solid fa-map-location-dot"></i>
                    View Map

                </button>


                <button
                    class="book-btn"
                    onclick="openAppointmentModal(
                        '${escapeAttribute(name)}',
                        '${escapeAttribute(address)}',
                        '${doctor.id || ""}'
                    )">

                    <i class="fa-solid fa-calendar-check"></i>
                    Book Appointment

                </button>

            </div>

        `;


        container.appendChild(card);

    });

}


/* =====================================================
   BOOK HOSPITAL
===================================================== */

function bookHospital(placeId) {

    const hospital =
        hospitals.find(
            item => item.id === placeId
        );


    if (!hospital) {
        return;
    }


    const name =
        hospital.displayName?.text ||
        "Hospital";


    const address =
        hospital.formattedAddress ||
        "Hospital";


    openAppointmentModal(
        "Hospital Appointment",
        name + " • " + address,
        placeId
    );

}


/* =====================================================
   OPEN APPOINTMENT MODAL
===================================================== */

function openAppointmentModal(
    doctorName,
    hospitalName,
    placeId
) {

    selectedDoctor = {

        doctor:
            doctorName,

        hospital:
            hospitalName,

        placeId:
            placeId

    };


    document.getElementById(
        "appointmentDoctor"
    ).textContent =
        doctorName;


    document.getElementById(
        "appointmentHospital"
    ).textContent =
        hospitalName;


    document.getElementById(
        "selectedPlaceId"
    ).value =
        placeId;


    document.getElementById(
        "selectedDoctorName"
    ).value =
        doctorName;


    document.getElementById(
        "selectedHospitalName"
    ).value =
        hospitalName;


    document.getElementById(
        "appointmentModal"
    ).classList.remove("hidden");


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeAppointmentModal() {

    document.getElementById(
        "appointmentModal"
    ).classList.add("hidden");


    document.body.style.overflow =
        "";

}


/* =====================================================
   CONFIRM APPOINTMENT
===================================================== */

function confirmAppointment(event) {

    event.preventDefault();


    const patientName =
        document.getElementById(
            "patientName"
        ).value.trim();


    const phone =
        document.getElementById(
            "patientPhone"
        ).value.trim();


    const date =
        document.getElementById(
            "appointmentDate"
        ).value;


    const time =
        document.getElementById(
            "appointmentTime"
        ).value;


    const reason =
        document.getElementById(
            "visitReason"
        ).value.trim();


    const doctor =
        document.getElementById(
            "selectedDoctorName"
        ).value;


    const hospital =
        document.getElementById(
            "selectedHospitalName"
        ).value;


    const placeId =
        document.getElementById(
            "selectedPlaceId"
        ).value;


    const appointment = {

        id:
            "CN-" +
            Date.now(),

        patientName:
            patientName,

        phone:
            phone,

        doctor:
            doctor,

        hospital:
            hospital,

        date:
            date,

        time:
            time,

        reason:
            reason,

        placeId:
            placeId,

        status:
            "Confirmed",

        createdAt:
            new Date().toISOString()

    };


    const appointments =
        JSON.parse(
            localStorage.getItem(
                "carenestAppointments"
            )
        ) || [];


    appointments.push(
        appointment
    );


    localStorage.setItem(
        "carenestAppointments",
        JSON.stringify(
            appointments
        )
    );


    document.getElementById(
        "appointmentForm"
    ).reset();


    closeAppointmentModal();


    loadAppointments();


    document.getElementById(
        "appointments"
    ).scrollIntoView({
        behavior: "smooth"
    });


    setTimeout(function () {

        alert(
            "✅ Appointment confirmed successfully!\n\n" +
            "Appointment ID: " +
            appointment.id
        );

    }, 500);

}


/* =====================================================
   LOAD APPOINTMENTS
===================================================== */

function loadAppointments() {

    const container =
        document.getElementById(
            "appointmentList"
        );


    const appointments =
        JSON.parse(
            localStorage.getItem(
                "carenestAppointments"
            )
        ) || [];


    if (appointments.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-calendar-check"></i>

                </div>

                <h3>No Appointments Yet</h3>

                <p>
                    Your confirmed CareNest appointments
                    will appear here.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    appointments
        .slice()
        .reverse()
        .forEach(function (appointment) {

            const card =
                document.createElement("div");


            card.className =
                "appointment-card";


            card.innerHTML = `

                <div>

                    <h3>
                        ${escapeHTML(
                            appointment.doctor
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            appointment.hospital
                        )}
                    </p>

                    <p>
                        📅 ${formatDate(
                            appointment.date
                        )}
                        &nbsp; • &nbsp;
                        ⏰ ${escapeHTML(
                            appointment.time
                        )}
                    </p>

                    <small>
                        Appointment ID:
                        ${escapeHTML(
                            appointment.id
                        )}
                    </small>

                </div>


                <span class="appointment-status">
                    ✓ Confirmed
                </span>

            `;


            container.appendChild(card);

        });

}


/* =====================================================
   DISTANCE
===================================================== */

function getDistanceFromUser(
    latitude,
    longitude
) {

    if (
        currentLatitude === null ||
        currentLongitude === null ||
        !latitude ||
        !longitude
    ) {

        return "Distance unavailable";

    }


    const R = 6371;


    const dLat =
        (latitude -
            currentLatitude) *
        Math.PI / 180;


    const dLon =
        (longitude -
            currentLongitude) *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            currentLatitude *
            Math.PI / 180
        ) *

        Math.cos(
            latitude *
            Math.PI / 180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    const distance =
        R * c;


    return distance.toFixed(1) +
        " km away";

}


/* =====================================================
   OPEN GOOGLE MAPS
===================================================== */

function openGoogleMaps(url) {

    if (!url) {
        return;
    }


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =====================================================
   DATE
===================================================== */

function setMinimumDate() {

    const input =
        document.getElementById(
            "appointmentDate"
        );


    if (!input) {
        return;
    }


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    input.min =
        today;

}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString + "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =====================================================
   NAVIGATION
===================================================== */

function scrollToSection(id) {

    const section =
        document.getElementById(id);


    if (section) {

        section.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =====================================================
   SECURITY
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text || "";


    return div.innerHTML;

}


function escapeAttribute(text) {

    return String(
        text || ""
    )
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");

}