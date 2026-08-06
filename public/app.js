/* ==========================================================================
   INTERACTIVE ENGINE — BEAUTY SALON «КОЛЯН» (KYIV REAL MARKET UAH PRICES)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------------------
    // 1. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
    // ----------------------------------------------------------------------
    const revealElements = document.querySelectorAll(
        '.section-header, .service-card-shell, .stat-card-bezel, .transformation-stage, .calculator-shell, .booking-widget-shell, .review-card-shell, .contact-info-card-shell, .map-card-shell'
    );

    revealElements.forEach(el => el.classList.add('reveal-on-scroll'));

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));

    // ----------------------------------------------------------------------
    // 2. LUXURY CUSTOM CURSOR
    // ----------------------------------------------------------------------
    const cursorDot = document.getElementById('customCursor');
    const cursorFollower = document.getElementById('customCursorFollower');

    if (cursorDot && cursorFollower) {
        let posX = 0, posY = 0;
        let mouseX = 0, mouseY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        });

        function animateFollower() {
            posX += (mouseX - posX) * 0.15;
            posY += (mouseY - posY) * 0.15;
            cursorFollower.style.left = `${posX}px`;
            cursorFollower.style.top = `${posY}px`;
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        document.querySelectorAll('a, button, .service-card-shell, .quiz-option, .master-card-shell').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorDot.style.width = '14px';
                cursorDot.style.height = '14px';
                cursorFollower.style.width = '44px';
                cursorFollower.style.height = '44px';
                cursorFollower.style.borderColor = 'var(--color-pink-primary)';
            });
            el.addEventListener('mouseleave', () => {
                cursorDot.style.width = '8px';
                cursorDot.style.height = '8px';
                cursorFollower.style.width = '32px';
                cursorFollower.style.height = '32px';
            });
        });
    }

    // ----------------------------------------------------------------------
    // 3. WEB AUDIO API SYNTHESIZER (HAPTIC SOUND EFFECTS)
    // ----------------------------------------------------------------------
    let soundEnabled = true;
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSoftClickSound() {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(580, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {}
    }

    function playChimeSound() {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.06, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.4);
            });
        } catch (e) {}
    }

    document.querySelectorAll('button, a.btn-nested-primary, .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => playSoftClickSound());
    });

    const soundToggle = document.getElementById('soundToggle');
    const soundIcon = document.getElementById('soundIcon');
    if (soundToggle && soundIcon) {
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundIcon.className = soundEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line';
        });
    }

    // ----------------------------------------------------------------------
    // 4. DARK / LIGHT THEME TOGGLE
    // ----------------------------------------------------------------------
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const htmlEl = document.documentElement;

    if (themeToggle && themeIcon) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', newTheme);
            themeIcon.className = newTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-clear-line';
        });
    }

    // ----------------------------------------------------------------------
    // 5. MOBILE HAMBURGER MENU OVERLAY
    // ----------------------------------------------------------------------
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (hamburgerBtn && mobileMenuOverlay) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenuOverlay.classList.toggle('active');
        });

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
            });
        });
    }

    // ----------------------------------------------------------------------
    // 6. SERVICES CATEGORY TABS FILTERING
    // ----------------------------------------------------------------------
    const tabBtns = document.querySelectorAll('.services-tabs-core .tab-btn');
    const serviceCards = document.querySelectorAll('.services-grid .service-card-shell');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');
            serviceCards.forEach(card => {
                if (card.classList.contains(category)) {
                    card.classList.add('active');
                    card.classList.add('revealed');
                } else {
                    card.classList.remove('active');
                }
            });
        });
    });

    document.querySelectorAll('.btn-service-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const sId = btn.getAttribute('data-service-id');
            const targetCb = document.querySelector(`.b-service-cb[data-id="${sId}"]`);
            if (targetCb) {
                targetCb.checked = true;
                updateBookingSummary();
            }
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ----------------------------------------------------------------------
    // 7. GALLERY TRANSFORMATION STAGE CONTROLLER
    // ----------------------------------------------------------------------
    const galleryMainVideo = document.getElementById('galleryMainVideo');
    const galleryMainImg = document.getElementById('galleryMainImg');
    const videoTitle = document.getElementById('videoTitle');
    const stageBadgeIcon = document.getElementById('stageBadgeIcon');
    const unmuteStageBtn = document.getElementById('unmuteStageBtn');
    const thumbCards = document.querySelectorAll('.gallery-thumbs-row .thumb-card');

    thumbCards.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbCards.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');

            const videoSrc = thumb.getAttribute('data-video');
            const imgSrc = thumb.getAttribute('data-img');
            const title = thumb.getAttribute('data-title');

            if (videoTitle) videoTitle.textContent = title;

            if (videoSrc && galleryMainVideo) {
                if (galleryMainImg) galleryMainImg.style.display = 'none';
                galleryMainVideo.style.display = 'block';
                galleryMainVideo.src = videoSrc;
                galleryMainVideo.play();
                if (stageBadgeIcon) stageBadgeIcon.className = 'ri-play-fill';
                if (unmuteStageBtn) unmuteStageBtn.style.display = 'inline-flex';
            } else if (imgSrc && galleryMainImg) {
                if (galleryMainVideo) {
                    galleryMainVideo.pause();
                    galleryMainVideo.style.display = 'none';
                }
                galleryMainImg.src = imgSrc;
                galleryMainImg.style.display = 'block';
                if (stageBadgeIcon) stageBadgeIcon.className = 'ri-image-line';
                if (unmuteStageBtn) unmuteStageBtn.style.display = 'none';
            }
        });
    });

    if (unmuteStageBtn && galleryMainVideo) {
        unmuteStageBtn.addEventListener('click', () => {
            galleryMainVideo.muted = !galleryMainVideo.muted;
            unmuteStageBtn.innerHTML = galleryMainVideo.muted ? 
                '<i class="ri-volume-mute-line"></i> Увімкнути звук' : 
                '<i class="ri-volume-up-line"></i> Вимкнути звук';
        });
    }

    // ----------------------------------------------------------------------
    // 8. INTERACTIVE PRICE CALCULATOR QUIZ (UAH OUTPUT)
    // ----------------------------------------------------------------------
    const quizOptions = document.querySelectorAll('#quizContainer input[type="checkbox"]');
    const quizTotalTime = document.getElementById('quizTotalTime');
    const quizTotalPrice = document.getElementById('quizTotalPrice');
    const btnBookQuizPackage = document.getElementById('btnBookQuizPackage');

    function calculateQuizTotals() {
        let totalTime = 0;
        let totalPrice = 0;

        quizOptions.forEach(opt => {
            if (opt.checked) {
                totalTime += parseInt(opt.getAttribute('data-time') || 0);
                totalPrice += parseInt(opt.getAttribute('data-price') || 0);
            }
        });

        const discountedPrice = Math.round(totalPrice * 0.9);

        if (quizTotalTime) quizTotalTime.textContent = `${totalTime} хв`;
        if (quizTotalPrice) quizTotalPrice.textContent = `${discountedPrice.toLocaleString()} грн`;
    }

    quizOptions.forEach(opt => {
        opt.addEventListener('change', calculateQuizTotals);
    });

    if (btnBookQuizPackage) {
        btnBookQuizPackage.addEventListener('click', () => {
            quizOptions.forEach(opt => {
                if (opt.checked) {
                    const val = opt.value;
                    if (val === 'lashes') {
                        const cb = document.querySelector('.b-service-cb[data-id="1"]');
                        if (cb) cb.checked = true;
                    } else if (val === 'brows') {
                        const cb = document.querySelector('.b-service-cb[data-id="3"]');
                        if (cb) cb.checked = true;
                    } else if (val === 'nails') {
                        const cb = document.querySelector('.b-service-cb[data-id="5"]');
                        if (cb) cb.checked = true;
                    }
                }
            });
            updateBookingSummary();
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // ----------------------------------------------------------------------
    // 9. MULTI-STEP ONLINE BOOKING MACHINE (UAH OUTPUT & CATEGORY MASTERS)
    // ----------------------------------------------------------------------
    let currentBookingStep = 1;
    const totalBookingSteps = 4;

    const progressSteps = document.querySelectorAll('.booking-progress-bar .progress-step');
    const stepContents = document.querySelectorAll('.booking-steps-body .b-step-content');
    const btnBookingPrev = document.getElementById('btnBookingPrev');
    const btnBookingNext = document.getElementById('btnBookingNext');
    const summaryCount = document.getElementById('summaryCount');
    const summaryTime = document.getElementById('summaryTime');
    const summaryPrice = document.getElementById('summaryPrice');

    const serviceCbs = document.querySelectorAll('.b-service-cb');
    const bCatBtns = document.querySelectorAll('.b-cat-btn');
    const bCatItems = document.querySelectorAll('.bcat-item');
    const catMastersGrids = document.querySelectorAll('.cat-masters');
    const masterCards = document.querySelectorAll('.master-card-shell');
    let selectedMasterName = 'Олена Соколова (Старший Top Lash Artist)';
    let activeCategory = 'lashes';

    function formatMinutesToHours(totalMinutes) {
        if (totalMinutes === 0) return '0 хв';
        if (totalMinutes < 60) return `${totalMinutes} хв`;
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return mins > 0 ? `~${hrs} год ${mins} хв` : `~${hrs} год`;
    }

    function updateBookingSummary() {
        let count = 0;
        let totalMinutes = 0;
        let totalPrice = 0;

        serviceCbs.forEach(cb => {
            if (cb.checked) {
                count++;
                totalMinutes += parseInt(cb.getAttribute('data-time') || 0);
                totalPrice += parseInt(cb.getAttribute('data-price') || 0);
            }
        });

        if (summaryCount) {
            summaryCount.textContent = count === 1 ? '1 процедура' : `${count} процедури`;
        }
        if (summaryTime) {
            summaryTime.textContent = formatMinutesToHours(totalMinutes);
        }
        if (summaryPrice) {
            summaryPrice.textContent = `${totalPrice.toLocaleString()} грн`;
        }
    }

    function switchBookingCategory(cat) {
        activeCategory = cat;
        bCatBtns.forEach(btn => {
            if (btn.getAttribute('data-bcat') === cat) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        bCatItems.forEach(item => {
            if (item.classList.contains(cat)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        catMastersGrids.forEach(grid => {
            if (grid.classList.contains(cat)) {
                grid.classList.add('active');
            } else {
                grid.classList.remove('active');
            }
        });

        document.querySelectorAll('.master-card-shell').forEach(m => m.classList.remove('selected'));
        const activeMasters = document.querySelectorAll(`.cat-masters.${cat} .master-card-shell`);
        if (activeMasters.length > 0) {
            activeMasters[0].classList.add('selected');
            selectedMasterName = activeMasters[0].getAttribute('data-master-name') || 'Олена Соколова';
        }
    }

    bCatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-bcat');
            switchBookingCategory(cat);
        });
    });

    serviceCbs.forEach(cb => cb.addEventListener('change', updateBookingSummary));

    masterCards.forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.master-card-shell').forEach(m => m.classList.remove('selected'));
            card.classList.add('selected');
            selectedMasterName = card.getAttribute('data-master-name') || 'Олена Соколова';
        });
    });

    // ----------------------------------------------------------------------
    // 10. CLOUDFLARE D1 DATABASE & TIME SLOT CONTROLLER
    // ----------------------------------------------------------------------
    const TECHNICAL_BUFFER_MINUTES = 5; // Минимальный технический перерыв между приёмами ровно 5 минут!

    function getStoredBookings() {
        try {
            return JSON.parse(localStorage.getItem('beauty_salon_bookings_v2')) || [];
        } catch(e) {
            return [];
        }
    }

    const ALTEGIO_COMPANY_ID = '1386901';
    const ALTEGIO_PARTNER_TOKEN = 'eygdaa9bgg844dse4at5';
    const ALTEGIO_STAFF_MAP = {
        'm1': 3081874, // Олена Соколова
        'm2': 3081874, // Аліна
        'm3': 3081868, // Микола
        'default': 3081868
    };
    const ALTEGIO_SERVICE_ID = 13734350;

    async function sendDirectToAltegio(bookingObj) {
        try {
            const currentYear = new Date().getFullYear();
            let monthStr = '08';
            let dayStr = '08';
            if (bookingObj.date) {
                const lowerDate = bookingObj.date.toLowerCase();
                const parts = bookingObj.date.split(' ');
                const dayNum = parseInt(parts[0]);
                if (!isNaN(dayNum)) {
                    dayStr = dayNum < 10 ? '0' + dayNum : '' + dayNum;
                }
                if (lowerDate.includes('січ')) monthStr = '01';
                else if (lowerDate.includes('лют')) monthStr = '02';
                else if (lowerDate.includes('берез')) monthStr = '03';
                else if (lowerDate.includes('квіт')) monthStr = '04';
                else if (lowerDate.includes('трав')) monthStr = '05';
                else if (lowerDate.includes('черв')) monthStr = '06';
                else if (lowerDate.includes('лип')) monthStr = '07';
                else if (lowerDate.includes('серп')) monthStr = '08';
                else if (lowerDate.includes('верес')) monthStr = '09';
                else if (lowerDate.includes('жовт')) monthStr = '10';
                else if (lowerDate.includes('листоп')) monthStr = '11';
                else if (lowerDate.includes('груд')) monthStr = '12';
            }
            const cleanTime = (bookingObj.time || '14:00').trim();
            const formattedDatetime = `${currentYear}-${monthStr}-${dayStr}T${cleanTime}:00+03:00`;
            const cleanPhone = (bookingObj.phone || '').replace(/\D/g, '');

            const masterId = bookingObj.masterId || 'm1';
            const masterName = bookingObj.masterName || '';
            const targetStaffId = ALTEGIO_STAFF_MAP[masterId] || (masterName.includes('Олена') ? 3081874 : 3081868);

            const sendReq = (staffId) => {
                return fetch(`https://api.altegio.com/api/v1/book_record/${ALTEGIO_COMPANY_ID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.api.v2+json',
                        'Authorization': `Bearer ${ALTEGIO_PARTNER_TOKEN}`
                    },
                    body: JSON.stringify({
                        phone: cleanPhone,
                        fullname: bookingObj.clientName || 'Клієнт',
                        email: 'client@beauty-salon.kyiv',
                        comment: `Запис з сайту: ${bookingObj.serviceName || 'Послуга'} (Майстер: ${masterName}). ${bookingObj.notes || ''}`.trim(),
                        appointments: [{
                            id: 1,
                            services: [ALTEGIO_SERVICE_ID],
                            staff_id: staffId,
                            datetime: formattedDatetime
                        }]
                    })
                });
            };

            let res = await sendReq(targetStaffId);
            if (!res.ok && targetStaffId !== 3081868) {
                await sendReq(3081868);
            }
        } catch(e) {
            console.warn('Altegio direct sync error:', e);
        }
    }

    async function saveBooking(bookingObj) {
        const bookings = getStoredBookings();
        bookings.push(bookingObj);
        localStorage.setItem('beauty_salon_bookings_v2', JSON.stringify(bookings));

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingObj)
            });
            const json = await res.json();
            return json;
        } catch (e) {
            console.warn('D1 Cloud Sync info:', e);
            return { success: false };
        }
    }

    function timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    const SALON_CLOSING_MINUTES = 20 * 60; // 20:00 (1200 хвилин)

    function minutesToFormattedTime(totalMins) {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        const hh = hrs < 10 ? '0' + hrs : '' + hrs;
        const mm = mins < 10 ? '0' + mins : '' + mins;
        return `${hh}:${mm}`;
    }

    function checkAndToggleOvertimeAlert(slotBtn) {
        const overtimeAlertBox = document.getElementById('overtimeAlertBox');
        const overtimeDescText = document.getElementById('overtimeDescText');
        if (!overtimeAlertBox) return;

        if (slotBtn && slotBtn.classList.contains('overtime')) {
            const slotTimeStr = slotBtn.getAttribute('data-time') || '19:00';
            const selectedCbs = document.querySelectorAll('.b-service-cb:checked');
            let selectedDuration = 0;
            selectedCbs.forEach(cb => {
                selectedDuration += parseInt(cb.getAttribute('data-time') || 90);
            });
            if (selectedDuration === 0) selectedDuration = 60;

            const endMin = timeToMinutes(slotTimeStr) + selectedDuration;
            const endTimeStr = minutesToFormattedTime(endMin);

            if (overtimeDescText) {
                overtimeDescText.innerHTML = `Ваша процедура триватиме до <strong>${endTimeStr}</strong>. Оскільки салон працює до 20:00, цей запис потребує особистого узгодження з майстром <strong>${selectedMasterName}</strong>.`;
            }
            overtimeAlertBox.style.display = 'block';
        } else {
            overtimeAlertBox.style.display = 'none';
        }
    }

    async function updateAvailableTimeSlots() {
        let bookings = getStoredBookings();

        const selectedMasterCard = document.querySelector('.cat-masters .master-card-shell.selected');
        const selectedMasterId = selectedMasterCard ? selectedMasterCard.getAttribute('data-master-id') : 'm1';

        // Запрашиваем свежие актуальные слоты из базы данных Cloudflare D1
        try {
            const res = await fetch(`/api/slots?date=${encodeURIComponent(selectedDateStr)}&masterId=${encodeURIComponent(selectedMasterId)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.bookings) && data.bookings.length > 0) {
                    const cloudBookings = data.bookings;
                    // Объединяем локальные и облачные записи
                    const ids = new Set(bookings.map(b => b.id || (b.date + '_' + b.time)));
                    cloudBookings.forEach(cb => {
                        const cbKey = cb.id || (cb.date + '_' + cb.time);
                        if (!ids.has(cbKey)) {
                            bookings.push(cb);
                        }
                    });
                }
            }
        } catch(e) {}

        const selectedCbs = document.querySelectorAll('.b-service-cb:checked');
        let selectedDuration = 0;
        selectedCbs.forEach(cb => {
            selectedDuration += parseInt(cb.getAttribute('data-time') || 90);
        });
        if (selectedDuration === 0) selectedDuration = 60;

        const clientPhone = (document.getElementById('clientPhone')?.value || '').trim();
        const allTimeSlots = document.querySelectorAll('#timeSlotsGrid .time-slot-btn');

        allTimeSlots.forEach(slotBtn => {
            const slotTimeStr = slotBtn.getAttribute('data-time');
            const slotStartMin = timeToMinutes(slotTimeStr);
            const slotEndMin = slotStartMin + selectedDuration;
            let isConflict = false;

            bookings.forEach(b => {
                if (b.date === selectedDateStr) {
                    const bStartMin = timeToMinutes(b.time);
                    const bDuration = parseInt(b.duration || 90);
                    const bEndMinWithBuffer = bStartMin + bDuration + TECHNICAL_BUFFER_MINUTES;

                    const isSameMaster = (b.masterId || b.master_id) === selectedMasterId;
                    const isSameClient = clientPhone && b.phone === clientPhone;

                    if (isSameMaster || isSameClient) {
                        if (slotStartMin < bEndMinWithBuffer && slotEndMin > bStartMin) {
                            isConflict = true;
                        }
                    }
                }
            });

            if (isConflict) {
                slotBtn.classList.add('disabled');
                slotBtn.classList.remove('active');
                slotBtn.classList.remove('overtime');
            } else {
                slotBtn.classList.remove('disabled');
                if (slotEndMin > SALON_CLOSING_MINUTES) {
                    slotBtn.classList.add('overtime');
                } else {
                    slotBtn.classList.remove('overtime');
                }
            }
        });

        const firstFreeSlot = document.querySelector('#timeSlotsGrid .time-slot-btn:not(.disabled)');
        const currentActiveSlot = document.querySelector('#timeSlotsGrid .time-slot-btn.active:not(.disabled)');

        if (!currentActiveSlot && firstFreeSlot) {
            firstFreeSlot.classList.add('active');
            selectedTimeStr = firstFreeSlot.getAttribute('data-time') || '13:00';
            checkAndToggleOvertimeAlert(firstFreeSlot);
        } else if (currentActiveSlot) {
            checkAndToggleOvertimeAlert(currentActiveSlot);
        }
    }

    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
    let selectedDateStr = '06 Серпня';
    let selectedTimeStr = '13:00';

    if (calendarDaysGrid) {
        const daysInMonth = 31;
        calendarDaysGrid.innerHTML = '';
        for (let d = 1; d <= daysInMonth; d++) {
            const dayBtn = document.createElement('button');
            const formattedDayStr = `${d < 10 ? '0' + d : d} Серпня`;
            dayBtn.setAttribute('data-date', formattedDayStr);
            dayBtn.textContent = d;
            dayBtn.addEventListener('click', () => {
                document.querySelectorAll('.cal-day-btn').forEach(b => b.classList.remove('active'));
                dayBtn.classList.add('active');
                selectedDateStr = formattedDayStr;
                updateAvailableTimeSlots();
            });
            calendarDaysGrid.appendChild(dayBtn);
        }
    }

    const timeSlotBtns = document.querySelectorAll('#timeSlotsGrid .time-slot-btn');
    timeSlotBtns.forEach(slot => {
        slot.addEventListener('click', () => {
            if (slot.classList.contains('disabled')) return;
            timeSlotBtns.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            selectedTimeStr = slot.getAttribute('data-time') || '13:00';
            checkAndToggleOvertimeAlert(slot);
        });
    });

    function renderBookingStep(step) {
        stepContents.forEach(content => content.classList.remove('active'));
        const targetStepContent = document.getElementById(`bStep${step}`);
        if (targetStepContent) targetStepContent.classList.add('active');

        progressSteps.forEach(pStep => {
            const stepNum = parseInt(pStep.getAttribute('data-step') || 1);
            if (stepNum <= step) {
                pStep.classList.add('active');
            } else {
                pStep.classList.remove('active');
            }
        });

        if (step === 3) {
            updateAvailableTimeSlots();
        }

        if (btnBookingPrev) {
            btnBookingPrev.style.display = step > 1 ? 'inline-flex' : 'none';
        }

        if (btnBookingNext) {
            const btnTextEl = btnBookingNext.querySelector('.btn-text');
            if (btnTextEl) {
                btnTextEl.textContent = step === totalBookingSteps ? 'Підтвердити запис' : 'Далі';
            }
        }
    }

    // ----------------------------------------------------------------------
    // 11. STRICT UKRAINIAN PHONE NUMBER MASK & VALIDATOR
    // ----------------------------------------------------------------------
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientNameInput = document.getElementById('clientName');
    const phoneErrorMsg = document.getElementById('phoneErrorMsg');
    const nameErrorMsg = document.getElementById('nameErrorMsg');

    const VALID_UKR_CODES = ['39', '50', '63', '66', '67', '68', '73', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];

    function formatUkrPhone(val) {
        let digits = val.replace(/\D/g, '');

        if (digits.startsWith('380')) {
            digits = digits.substring(3);
        } else if (digits.startsWith('0')) {
            digits = digits.substring(1);
        } else if (digits.startsWith('80')) {
            digits = digits.substring(2);
        }

        digits = digits.substring(0, 9);

        let res = '+380 ';
        if (digits.length > 0) {
            res += '(' + digits.substring(0, 2);
        }
        if (digits.length >= 2) {
            res += ') ';
        }
        if (digits.length > 2) {
            res += digits.substring(2, 5);
        }
        if (digits.length >= 5) {
            res += '-';
        }
        if (digits.length > 5) {
            res += digits.substring(5, 7);
        }
        if (digits.length >= 7) {
            res += '-';
        }
        if (digits.length > 7) {
            res += digits.substring(7, 9);
        }

        return res;
    }

    let isDeletingPhone = false;

    if (clientPhoneInput) {
        clientPhoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                isDeletingPhone = true;
                const val = clientPhoneInput.value;
                if (val === '+380 ' || val.length <= 5) {
                    clientPhoneInput.value = '';
                    isDeletingPhone = false;
                }
            } else {
                isDeletingPhone = false;
            }
        });

        clientPhoneInput.addEventListener('focus', () => {
            if (!clientPhoneInput.value || clientPhoneInput.value.trim() === '') {
                clientPhoneInput.value = '+380 ';
            }
        });

        clientPhoneInput.addEventListener('input', (e) => {
            let raw = e.target.value;

            if (isDeletingPhone) {
                let digits = raw.replace(/\D/g, '');
                if (digits.startsWith('380')) digits = digits.substring(3);
                // При стирании удаляем последнюю цифру
                if (digits.length > 0) {
                    digits = digits.substring(0, digits.length - 1);
                }
                
                if (digits.length === 0) {
                    clientPhoneInput.value = '+380 ';
                    isDeletingPhone = false;
                    return;
                }
                raw = '380' + digits;
                isDeletingPhone = false;
            }

            clientPhoneInput.value = formatUkrPhone(raw);
            if (phoneErrorMsg) phoneErrorMsg.style.display = 'none';
            clientPhoneInput.classList.remove('invalid');
        });
    }

    if (clientNameInput) {
        clientNameInput.addEventListener('input', () => {
            if (nameErrorMsg) nameErrorMsg.style.display = 'none';
            clientNameInput.classList.remove('invalid');
        });
    }

    function isValidUkrPhone(phoneStr) {
        if (!phoneStr) return false;
        const digits = phoneStr.replace(/\D/g, '');
        return digits.length >= 7;
    }

    const btnEditTicket = document.getElementById('btnEditTicket');
    const btnFinalConfirm = document.getElementById('btnFinalConfirm');
    const tStatusBadge = document.getElementById('tStatusBadge');
    const tSuccessMsg = document.getElementById('tSuccessMsg');

    if (btnEditTicket) {
        btnEditTicket.addEventListener('click', () => {
            if (ticketModal) ticketModal.classList.remove('active');
        });
    }

    if (btnBookingNext) {
        btnBookingNext.addEventListener('click', () => {
            if (currentBookingStep === 4) {
                let isValid = true;
                const nameVal = (clientNameInput?.value || '').trim();
                const phoneVal = (clientPhoneInput?.value || '').trim();

                if (nameVal.length < 2) {
                    isValid = false;
                    if (clientNameInput) {
                        clientNameInput.classList.add('invalid');
                        clientNameInput.focus();
                    }
                    if (nameErrorMsg) nameErrorMsg.style.display = 'block';
                }

                if (!isValidUkrPhone(phoneVal)) {
                    isValid = false;
                    if (clientPhoneInput) {
                        clientPhoneInput.classList.add('invalid');
                        if (nameVal.length >= 2) clientPhoneInput.focus();
                    }
                    if (phoneErrorMsg) phoneErrorMsg.style.display = 'block';
                }

                if (!isValid) return;
            }

            if (currentBookingStep < totalBookingSteps) {
                currentBookingStep++;
                renderBookingStep(currentBookingStep);
            } else {
                const clientName = clientNameInput ? clientNameInput.value || 'Клієнт' : 'Клієнт';
                const clientPhone = clientPhoneInput ? clientPhoneInput.value || '+380 67 000 0000' : '+380 67 000 0000';
            const notesInput = document.getElementById('clientNotes');
            const clientNotes = notesInput ? notesInput.value || '' : '';

                const selectedMasterCard = document.querySelector('.cat-masters .master-card-shell.selected');
                const currentMasterId = selectedMasterCard ? selectedMasterCard.getAttribute('data-master-id') : 'm1';

                const selectedRadio = document.querySelector('.b-service-cb:checked');
                const serviceName = selectedRadio ? selectedRadio.getAttribute('data-name') : 'Оксамитовий Об\'єм 2D / 3D';
                const serviceDuration = selectedRadio ? parseInt(selectedRadio.getAttribute('data-time') || 90) : 90;
                const activeSlot = document.querySelector('#timeSlotsGrid .time-slot-btn.active');
                const isOvertime = activeSlot ? activeSlot.classList.contains('overtime') : false;

                const bookingPayload = {
                    date: selectedDateStr,
                    time: selectedTimeStr,
                    duration: serviceDuration,
                    masterId: currentMasterId,
                    masterName: selectedMasterName,
                    serviceName: serviceName,
                    clientName: clientName,
                    phone: clientPhone,
                    notes: clientNotes,
                    isOvertime: isOvertime
                };

                // 1. Показываем статус отправки на кнопке
                const origBtnText = btnBookingNext.innerHTML;
                btnBookingNext.disabled = true;
                btnBookingNext.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Запис в Altegio...';

                // 2. Ждём гарантированного ответа от сервера и Altegio API!
                saveBooking(bookingPayload).then((altegioRes) => {
                    btnBookingNext.disabled = false;
                    btnBookingNext.innerHTML = origBtnText;

                    document.getElementById('tClientName').textContent = clientName;
                    document.getElementById('tMasterName').textContent = selectedMasterName;
                    document.getElementById('tDateTime').textContent = `${selectedDateStr}, ${selectedTimeStr}${isOvertime ? ' (❓ Понадурочно)' : ''}`;
                    document.getElementById('tServicesList').textContent = serviceName;
                    document.getElementById('tTotalPrice').textContent = summaryPrice ? summaryPrice.textContent : '950 грн';

                    let recIdText = '';
                    if (altegioRes && altegioRes.altegio && altegioRes.altegio.data && altegioRes.altegio.data[0]) {
                        recIdText = ` (#${altegioRes.altegio.data[0].record_id})`;
                    }

                    if (tStatusBadge) {
                        tStatusBadge.className = 'ticket-status-badge confirmed';
                        tStatusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                        tStatusBadge.style.color = '#10B981';
                        tStatusBadge.innerHTML = `<i class="ri-checkbox-circle-fill"></i> ЗАПИС ПІДТВЕРДЖЕНО ТА НАДІСЛАНО В ALTEGIO${recIdText}`;
                    }
                    if (tSuccessMsg) tSuccessMsg.style.display = 'block';

                    if (ticketModal) {
                        ticketModal.classList.add('active');
                    }
                }).catch(() => {
                    btnBookingNext.disabled = false;
                    btnBookingNext.innerHTML = origBtnText;
                    if (ticketModal) ticketModal.classList.add('active');
                });
            }
        });
    }

    if (btnFinalConfirm) {
        btnFinalConfirm.addEventListener('click', () => {
            const clientName = clientNameInput ? clientNameInput.value || 'Катерина' : 'Катерина';
            const clientPhone = clientPhoneInput ? clientPhoneInput.value || '+380 67 000 0000' : '+380 67 000 0000';
            const selectedRadio = document.querySelector('.b-service-cb:checked');
            const selectedMasterCard = document.querySelector('.cat-masters .master-card-shell.selected');
            const masterId = selectedMasterCard ? selectedMasterCard.getAttribute('data-master-id') : 'm1';
            const serviceDuration = selectedRadio ? parseInt(selectedRadio.getAttribute('data-time') || 90) : 90;
            const serviceName = selectedRadio ? selectedRadio.getAttribute('data-name') : 'Оксамитовий Об\'єм 2D / 3D';
            const activeSlot = document.querySelector('#timeSlotsGrid .time-slot-btn.active');
            const isOvertime = activeSlot ? activeSlot.classList.contains('overtime') : false;

            saveBooking({
                date: selectedDateStr,
                time: selectedTimeStr,
                duration: serviceDuration,
                masterId: masterId,
                masterName: selectedMasterName,
                serviceName: serviceName,
                clientName: clientName,
                phone: clientPhone,
                isOvertime: isOvertime,
                telegramStatus: isOvertime ? '❓ ПОНАДУРОЧНО (ПОТРЕБУЄ УЗГОДЖЕННЯ)' : '✅ ПІДТВЕРДЖЕНО'
            });

            playChimeSound();

            if (tStatusBadge) {
                if (isOvertime) {
                    tStatusBadge.className = 'ticket-status-badge confirmed';
                    tStatusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
                    tStatusBadge.style.color = '#D97706';
                    tStatusBadge.innerHTML = '<i class="ri-question-mark"></i> НАДІСЛАНО НА УЗГОДЖЕННЯ';
                } else {
                    tStatusBadge.className = 'ticket-status-badge confirmed';
                    tStatusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                    tStatusBadge.style.color = '#10B981';
                    tStatusBadge.innerHTML = '<i class="ri-checkbox-circle-fill"></i> ЗАПИС ПІДТВЕРДЖЕНО';
                }
            }

            if (tSuccessMsg) {
                if (isOvertime) {
                    tSuccessMsg.innerHTML = '<i class="ri-question-line"></i> Дякуємо! Запит надіслано в Telegram майстру для узгодження прийому після 20:00! 📲';
                    tSuccessMsg.style.color = '#D97706';
                    tSuccessMsg.style.background = 'rgba(245, 158, 11, 0.12)';
                } else {
                    tSuccessMsg.innerHTML = '<i class="ri-checkbox-circle-fill"></i> Дякуємо! Вашу броню успішно внесено в графік майстра! 🎉';
                    tSuccessMsg.style.color = '#10B981';
                    tSuccessMsg.style.background = 'rgba(16, 185, 129, 0.1)';
                }
                tSuccessMsg.style.display = 'block';
            }

            setTimeout(() => {
                if (ticketModal) ticketModal.classList.remove('active');
            }, 2200);
        });
    }

    if (btnBookingPrev) {
        btnBookingPrev.style.display = 'none';
        btnBookingPrev.addEventListener('click', () => {
            if (currentBookingStep > 1) {
                currentBookingStep--;
                renderBookingStep(currentBookingStep);
            }
        });
    }

    const closeTicketModal = document.getElementById('closeTicketModal');
    const ticketModal = document.getElementById('ticketModal');
    if (closeTicketModal && ticketModal) {
        closeTicketModal.addEventListener('click', () => {
            ticketModal.classList.remove('active');
        });
    }

    updateBookingSummary();

    // Auto-remove any cached/injected Altegio widget elements from DOM
    setInterval(() => {
        document.querySelectorAll('*[class*="ms_widget"], *[id*="ms_widget"], *[class*="yclients"], *[id*="yclients"], *[class*="alteg"], *[id*="alteg"]').forEach(el => el.remove());
    }, 100);
});


