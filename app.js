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
                '<i class="ri-volume-mute-line"></i> Включить звук' : 
                '<i class="ri-volume-up-line"></i> Выключить звук';
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

        if (quizTotalTime) quizTotalTime.textContent = `${totalTime} мин`;
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
    // 9. MULTI-STEP ONLINE BOOKING MACHINE (UAH OUTPUT)
    // ----------------------------------------------------------------------
    let currentBookingStep = 1;
    const totalBookingSteps = 4;

    const progressSteps = document.querySelectorAll('.booking-progress-bar .progress-step');
    const stepContents = document.querySelectorAll('.booking-steps-body .b-step-content');
    const btnBookingPrev = document.getElementById('btnBookingPrev');
    const btnBookingNext = document.getElementById('btnBookingNext');
    const summaryCount = document.getElementById('summaryCount');
    const summaryPrice = document.getElementById('summaryPrice');

    const serviceCbs = document.querySelectorAll('.b-service-cb');

    function updateBookingSummary() {
        let count = 0;
        let total = 0;

        serviceCbs.forEach(cb => {
            if (cb.checked) {
                count++;
                total += parseInt(cb.getAttribute('data-price') || 0);
            }
        });

        if (summaryCount) summaryCount.textContent = `${count} услуг`;
        if (summaryPrice) summaryPrice.textContent = `${total.toLocaleString()} грн`;
    }

    serviceCbs.forEach(cb => cb.addEventListener('change', updateBookingSummary));

    const masterCards = document.querySelectorAll('.master-card-shell');
    let selectedMasterName = 'Елена Соколова';

    masterCards.forEach(card => {
        card.addEventListener('click', () => {
            masterCards.forEach(m => m.classList.remove('selected'));
            card.classList.add('selected');
            selectedMasterName = card.getAttribute('data-master-name') || 'Елена Соколова';
        });
    });

    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
    let selectedDateStr = '06 Августа';
    let selectedTimeStr = '13:00';

    if (calendarDaysGrid) {
        const daysInMonth = 31;
        calendarDaysGrid.innerHTML = '';
        for (let d = 1; d <= daysInMonth; d++) {
            const dayBtn = document.createElement('button');
            dayBtn.className = `cal-day-btn ${d === 6 ? 'active' : ''}`;
            dayBtn.textContent = d;
            dayBtn.addEventListener('click', () => {
                document.querySelectorAll('.cal-day-btn').forEach(b => b.classList.remove('active'));
                dayBtn.classList.add('active');
                selectedDateStr = `${d < 10 ? '0' + d : d} Августа`;
            });
            calendarDaysGrid.appendChild(dayBtn);
        }
    }

    const timeSlotBtns = document.querySelectorAll('#timeSlotsGrid .time-slot-btn');
    timeSlotBtns.forEach(slot => {
        slot.addEventListener('click', () => {
            timeSlotBtns.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            selectedTimeStr = slot.getAttribute('data-time') || '13:00';
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

        if (btnBookingPrev) {
            btnBookingPrev.style.display = step > 1 ? 'inline-flex' : 'none';
        }

        if (btnBookingNext) {
            const btnTextEl = btnBookingNext.querySelector('.btn-text');
            if (btnTextEl) {
                btnTextEl.textContent = step === totalBookingSteps ? 'Завершить запись' : 'Далее';
            }
        }
    }

    if (btnBookingNext) {
        btnBookingNext.addEventListener('click', () => {
            if (currentBookingStep < totalBookingSteps) {
                currentBookingStep++;
                renderBookingStep(currentBookingStep);
            } else {
                const clientNameInput = document.getElementById('clientName');
                const clientName = clientNameInput ? clientNameInput.value || 'Екатерина' : 'Екатерина';

                document.getElementById('tClientName').textContent = clientName;
                document.getElementById('tMasterName').textContent = selectedMasterName;
                document.getElementById('tDateTime').textContent = `${selectedDateStr}, ${selectedTimeStr}`;
                
                const selectedServices = [];
                serviceCbs.forEach(cb => {
                    if (cb.checked) {
                        selectedServices.push(cb.getAttribute('data-name'));
                    }
                });
                document.getElementById('tServicesList').textContent = selectedServices.length > 0 ? selectedServices.join(', ') : 'Бархатный Объем 2D / 3D';
                document.getElementById('tTotalPrice').textContent = summaryPrice ? summaryPrice.textContent : '950 грн';

                playChimeSound();

                const ticketModal = document.getElementById('ticketModal');
                if (ticketModal) {
                    ticketModal.classList.add('active');
                }
            }
        });
    }

    if (btnBookingPrev) {
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
});
