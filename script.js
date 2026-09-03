/* =========================================================
   KIRA AUCTION — MAIN JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* -----------------------------------------------------
       SELECT ELEMENTS
       ----------------------------------------------------- */

    const navButtons = document.querySelectorAll(".nav-btn");

    const contentPanels = document.querySelectorAll(
        ".content-panel, .panel"
    );


    /* -----------------------------------------------------
       PANEL SELECTOR
       ----------------------------------------------------- */

    function getPanel(target) {

        if (!target) {
            return null;
        }

        /* Try common ID patterns */

        const possibleIds = [
            target,
            `${target}-panel`,
            `${target}Panel`,
            `panel-${target}`
        ];

        for (const id of possibleIds) {
            const element = document.getElementById(id);

            if (element) {
                return element;
            }
        }

        /* Try data-target */

        const matchingPanel = document.querySelector(
            `[data-panel="${target}"]`
        );

        if (matchingPanel) {
            return matchingPanel;
        }

        return null;
    }


    /* -----------------------------------------------------
       SHOW PANEL
       ----------------------------------------------------- */

    function showPanel(target, clickedButton = null) {

        /* Remove active state from all buttons */

        navButtons.forEach((button) => {
            button.classList.remove("active");
            button.setAttribute("aria-selected", "false");
        });


        /* Hide all panels */

        contentPanels.forEach((panel) => {
            panel.classList.remove("active");
            panel.setAttribute("aria-hidden", "true");
        });


        /* Activate clicked button */

        if (clickedButton) {

            clickedButton.classList.add("active");

            clickedButton.setAttribute(
                "aria-selected",
                "true"
            );
        }


        /* Find requested panel */

        const panel = getPanel(target);

        if (!panel) {
            console.warn(
                `KIRA Auction: Panel "${target}" was not found.`
            );

            return;
        }


        /* Show panel */

        panel.classList.add("active");

        panel.setAttribute(
            "aria-hidden",
            "false"
        );


        /* Restart animation */

        panel.style.animation = "none";

        requestAnimationFrame(() => {

            panel.style.animation = "";

        });


        /* Scroll content into view on mobile */

        if (window.innerWidth <= 780) {

            setTimeout(() => {

                const contentArea =
                    document.querySelector(".content-area");

                if (contentArea) {

                    contentArea.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }, 100);
        }
    }


    /* -----------------------------------------------------
       NAVIGATION BUTTON EVENTS
       ----------------------------------------------------- */

    navButtons.forEach((button) => {

        button.addEventListener("click", () => {

            let target =
                button.getAttribute("data-target");

            /*
             * If data-target is not present,
             * try href.
             */

            if (!target) {

                const href =
                    button.getAttribute("href");

                if (href && href.startsWith("#")) {

                    target = href.substring(1);

                }
            }


            /*
             * Try button ID as fallback.
             */

            if (!target) {

                target =
                    button.getAttribute("id");

            }


            if (target) {

                showPanel(
                    target,
                    button
                );

            }

        });

    });


    /* -----------------------------------------------------
       DEFAULT PANEL
       ----------------------------------------------------- */

    function initializeDefaultPanel() {

        /*
         * First priority:
         * button marked active
         */

        let defaultButton =
            document.querySelector(
                ".nav-btn.active"
            );


        /*
         * Second priority:
         * button with aria-selected=true
         */

        if (!defaultButton) {

            defaultButton =
                document.querySelector(
                    '.nav-btn[aria-selected="true"]'
                );

        }


        /*
         * Third priority:
         * first navigation button
         */

        if (!defaultButton && navButtons.length > 0) {

            defaultButton =
                navButtons[0];

        }


        if (defaultButton) {

            let target =
                defaultButton.getAttribute(
                    "data-target"
                );


            if (!target) {

                const href =
                    defaultButton.getAttribute("href");

                if (href && href.startsWith("#")) {

                    target =
                        href.substring(1);

                }

            }


            if (!target) {

                target =
                    defaultButton.getAttribute("id");

            }


            /*
             * If target exists, activate it.
             */

            if (target) {

                showPanel(
                    target,
                    defaultButton
                );

                return;

            }

        }


        /*
         * If no button target exists,
         * simply activate first panel.
         */

        if (contentPanels.length > 0) {

            contentPanels.forEach((panel, index) => {

                if (index === 0) {

                    panel.classList.add("active");

                    panel.setAttribute(
                        "aria-hidden",
                        "false"
                    );

                } else {

                    panel.classList.remove("active");

                    panel.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                }

            });

        }

    }


    initializeDefaultPanel();


    /* =====================================================
       CARD ANIMATION
       ===================================================== */

    const cards = document.querySelectorAll(
        ".rule-card, .note-card"
    );


    cards.forEach((card, index) => {

        card.style.animationDelay =
            `${Math.min(index * 0.04, 0.6)}s`;

    });


    /* =====================================================
       IMAGE LOAD ANIMATION
       ===================================================== */

    const images =
        document.querySelectorAll("img");


    images.forEach((image) => {

        image.addEventListener(
            "load",
            () => {

                image.classList.add(
                    "image-loaded"
                );

            }
        );

    });


    /* =====================================================
       ACTIVE NAVIGATION ON KEYBOARD
       ===================================================== */

    navButtons.forEach((button, index) => {

        button.addEventListener(
            "keydown",
            (event) => {

                let newIndex = index;


                /* Arrow Down / Right */

                if (
                    event.key === "ArrowDown" ||
                    event.key === "ArrowRight"
                ) {

                    newIndex =
                        (index + 1) %
                        navButtons.length;

                }


                /* Arrow Up / Left */

                if (
                    event.key === "ArrowUp" ||
                    event.key === "ArrowLeft"
                ) {

                    newIndex =
                        (index - 1 +
                            navButtons.length) %
                        navButtons.length;

                }


                if (newIndex !== index) {

                    event.preventDefault();

                    navButtons[newIndex].focus();

                }

            }
        );

    });


    /* =====================================================
       PREVENT HASH JUMP
       ===================================================== */

    document.querySelectorAll(
        '.nav-btn[href^="#"]'
    ).forEach((button) => {

        button.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

            }
        );

    });


    /* =====================================================
       HEADER / HERO PARALLAX
       ===================================================== */

    const hero =
        document.querySelector(".hero");

    const heroGavel =
        document.querySelector(".hero-gavel");


    if (hero && heroGavel) {

        hero.addEventListener(
            "mousemove",
            (event) => {

                /*
                 * Disable effect on small screens
                 */

                if (window.innerWidth <= 780) {
                    return;
                }


                const rect =
                    hero.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;

                const y =
                    event.clientY -
                    rect.top;


                const centerX =
                    rect.width / 2;

                const centerY =
                    rect.height / 2;


                const rotateY =
                    ((x - centerX) /
                        centerX) * 4;


                const rotateX =
                    ((centerY - y) /
                        centerY) * 3;


                heroGavel.style.transform =
                    `translateY(-5px)
                     rotateX(${rotateX}deg)
                     rotateY(${rotateY}deg)`;

            }
        );


        hero.addEventListener(
            "mouseleave",
            () => {

                heroGavel.style.transform =
                    "";

            }
        );

    }


    /* =====================================================
       BACK TO TOP WHEN LOGO IS CLICKED
       ===================================================== */

    const logo =
        document.querySelector(
            ".brand img, .logo img"
        );


    if (logo) {

        logo.style.cursor = "pointer";

        logo.addEventListener(
            "click",
            () => {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    /* =====================================================
       CURRENT YEAR
       ===================================================== */

    const yearElements =
        document.querySelectorAll(
            "[data-current-year]"
        );


    yearElements.forEach((element) => {

        element.textContent =
            new Date().getFullYear();

    });


    /* =====================================================
       CONSOLE MESSAGE
       ===================================================== */

    console.log(
        "%c KIRA AUCTION ",
        "background:#d9a441;color:#111;padding:6px 12px;border-radius:5px;font-weight:bold;"
    );

    console.log(
        "KIRA Auction website initialized successfully."
    );

});
