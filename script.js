"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const MOBILE_PARALLAX_BREAKPOINT = 780;
    const REVEAL_THRESHOLD = 0.12;
    const REVEAL_ROOT_MARGIN = "0px 0px -40px 0px";
    const STAGGER_STEP = 70;

    const state = {
        currentPanelId: null,
        panels: [],
        navigationItems: [],
        parallaxEnabled: false,
        reducedMotion: false,
        resizeTimer: null,
        parallaxFrame: null,
        pointerX: 0,
        pointerY: 0
    };

    function getReducedMotionPreference() {
        return window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    state.reducedMotion = getReducedMotionPreference();

    function getPanel(panelId) {
        if (!panelId) {
            return null;
        }

        const normalizedId = String(panelId)
            .replace(/^#/, "")
            .trim();

        if (!normalizedId) {
            return null;
        }

        return document.getElementById(normalizedId);
    }

    function getPanelIdFromElement(element) {
        if (!element) {
            return null;
        }

        const dataTarget = element.getAttribute("data-target");

        if (dataTarget) {
            return String(dataTarget).replace(/^#/, "").trim();
        }

        const href = element.getAttribute("href");

        if (href && href.indexOf("#") === 0) {
            return href.substring(1).trim();
        }

        const dataSection = element.getAttribute("data-section");

        if (dataSection) {
            return dataSection.replace(/^#/, "").trim();
        }

        const sectionTarget = element.getAttribute("data-section-target");

        if (sectionTarget) {
            return sectionTarget.replace(/^#/, "").trim();
        }

        const fallbackId = element.getAttribute("aria-controls");

        if (fallbackId) {
            return fallbackId.trim();
        }

        return null;
    }

    function isPanelElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const id = element.id;

        if (!id) {
            return false;
        }

        const dataSection = element.getAttribute("data-section");

        if (dataSection) {
            return true;
        }

        if (element.getAttribute("role") === "tabpanel") {
            return true;
        }

        if (element.classList.contains("panel")) {
            return true;
        }

        if (
            id === "terms" ||
            id === "notes" ||
            id === "home" ||
            id === "dashboard"
        ) {
            return true;
        }

        return false;
    }

    function collectPanels() {
        const candidates = Array.from(
            document.querySelectorAll(
                "[data-section], [role='tabpanel'], .panel, #terms, #notes"
            )
        );

        const uniquePanels = [];

        candidates.forEach(function (element) {
            if (!isPanelElement(element)) {
                return;
            }

            if (uniquePanels.indexOf(element) === -1) {
                uniquePanels.push(element);
            }
        });

        state.panels = uniquePanels;

        state.panels.forEach(function (panel) {
            panel.setAttribute("role", "tabpanel");

            if (!panel.hasAttribute("tabindex")) {
                panel.setAttribute("tabindex", "-1");
            }

            panel.setAttribute("aria-hidden", "true");
        });
    }

    function collectNavigationItems() {
        const candidates = Array.from(
            document.querySelectorAll(
                "[data-target], [data-section], [data-section-target], a[href^='#'], button[aria-controls]"
            )
        );

        const uniqueItems = [];

        candidates.forEach(function (element) {
            const targetId = getPanelIdFromElement(element);

            if (!targetId) {
                return;
            }

            const targetPanel = getPanel(targetId);

            if (!targetPanel) {
                return;
            }

            if (uniqueItems.indexOf(element) === -1) {
                uniqueItems.push(element);
            }
        });

        state.navigationItems = uniqueItems;

        state.navigationItems.forEach(function (item) {
            const targetId = getPanelIdFromElement(item);

            item.setAttribute("aria-controls", targetId);

            if (
                item.tagName === "BUTTON" ||
                item.getAttribute("role") === "tab"
            ) {
                item.setAttribute("role", "tab");
                item.setAttribute("aria-selected", "false");
                item.setAttribute("tabindex", "-1");
            }
        });
    }

    function updateNavigationState(panelId) {
        state.navigationItems.forEach(function (item) {
            const targetId = getPanelIdFromElement(item);
            const isActive = targetId === panelId;

            item.classList.toggle("active", isActive);
            item.classList.toggle("is-active", isActive);

            if (
                item.tagName === "BUTTON" ||
                item.getAttribute("role") === "tab"
            ) {
                item.setAttribute(
                    "aria-selected",
                    isActive ? "true" : "false"
                );

                item.setAttribute(
                    "tabindex",
                    isActive ? "0" : "-1"
                );
            }
        });
    }

    function updatePanelState(panelId) {
        state.panels.forEach(function (panel) {
            const isActive = panel.id === panelId;

            panel.classList.toggle("active", isActive);
            panel.classList.toggle("is-active", isActive);

            panel.setAttribute(
                "aria-hidden",
                isActive ? "false" : "true"
            );

            if (isActive) {
                panel.removeAttribute("hidden");
            } else {
                panel.setAttribute("hidden", "");
            }
        });
    }

    function showPanel(panelId, options) {
        const settings = Object.assign(
            {
                updateHash: true,
                scroll: true,
                focus: false
            },
            options || {}
        );

        const panel = getPanel(panelId);

        if (!panel) {
            return false;
        }

        const normalizedId = panel.id;

        updatePanelState(normalizedId);
        updateNavigationState(normalizedId);

        state.currentPanelId = normalizedId;

        if (settings.updateHash) {
            try {
                const currentHash = window.location.hash.replace(/^#/, "");

                if (currentHash !== normalizedId) {
                    window.history.replaceState(
                        null,
                        "",
                        "#" + normalizedId
                    );
                }
            } catch (error) {
                window.location.hash = normalizedId;
            }
        }

        if (settings.scroll) {
            const prefersReducedMotion = state.reducedMotion;

            try {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: prefersReducedMotion ? "auto" : "smooth"
                });
            } catch (error) {
                window.scrollTo(0, 0);
            }
        }

        if (settings.focus) {
            window.setTimeout(function () {
                try {
                    panel.focus({
                        preventScroll: true
                    });
                } catch (error) {
                    panel.focus();
                }
            }, state.reducedMotion ? 0 : 50);
        }

        window.dispatchEvent(
            new CustomEvent("kira:panelchange", {
                detail: {
                    panelId: normalizedId,
                    panel: panel
                }
            })
        );

        return true;
    }

    function findInitialPanel() {
        const hashId = window.location.hash.replace(/^#/, "").trim();

        if (hashId) {
            const hashPanel = getPanel(hashId);

            if (hashPanel) {
                return hashPanel.id;
            }
        }

        const activeNavigation = state.navigationItems.find(function (item) {
            return (
                item.classList.contains("active") ||
                item.classList.contains("is-active") ||
                item.getAttribute("aria-selected") === "true"
            );
        });

        if (activeNavigation) {
            const activeTarget = getPanelIdFromElement(activeNavigation);

            if (activeTarget && getPanel(activeTarget)) {
                return activeTarget;
            }
        }

        const activePanel = state.panels.find(function (panel) {
            return (
                panel.classList.contains("active") ||
                panel.classList.contains("is-active") ||
                panel.getAttribute("aria-hidden") === "false"
            );
        });

        if (activePanel) {
            return activePanel.id;
        }

        const firstPanel = state.panels[0];

        if (firstPanel) {
            return firstPanel.id;
        }

        return null;
    }

    function handleNavigationClick(event) {
        const target = event.currentTarget;
        const panelId = getPanelIdFromElement(target);

        if (!panelId) {
            return;
        }

        const panel = getPanel(panelId);

        if (!panel) {
            return;
        }

        const href = target.getAttribute("href");

        if (
            href &&
            href.indexOf("#") === 0 &&
            target.tagName.toLowerCase() === "a"
        ) {
            event.preventDefault();
        }

        showPanel(panelId, {
            updateHash: true,
            scroll: true,
            focus: false
        });
    }

    function attachNavigationEvents() {
        state.navigationItems.forEach(function (item) {
            item.addEventListener(
                "click",
                handleNavigationClick
            );
        });
    }

    function getNavigationIndex(item) {
        return state.navigationItems.indexOf(item);
    }

    function focusNavigationItem(index) {
        if (state.navigationItems.length === 0) {
            return;
        }

        let normalizedIndex = index;

        if (normalizedIndex < 0) {
            normalizedIndex = state.navigationItems.length - 1;
        }

        if (normalizedIndex >= state.navigationItems.length) {
            normalizedIndex = 0;
        }

        const item = state.navigationItems[normalizedIndex];

        if (!item) {
            return;
        }

        const panelId = getPanelIdFromElement(item);

        if (panelId) {
            showPanel(panelId, {
                updateHash: true,
                scroll: true,
                focus: false
            });
        }

        try {
            item.focus({
                preventScroll: true
            });
        } catch (error) {
            item.focus();
        }
    }

    function handleNavigationKeyboard(event) {
        const item = event.currentTarget;

        if (
            event.key !== "ArrowDown" &&
            event.key !== "ArrowRight" &&
            event.key !== "ArrowUp" &&
            event.key !== "ArrowLeft" &&
            event.key !== "Home" &&
            event.key !== "End" &&
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            const panelId = getPanelIdFromElement(item);

            if (panelId) {
                event.preventDefault();

                showPanel(panelId, {
                    updateHash: true,
                    scroll: true,
                    focus: false
                });
            }

            return;
        }

        event.preventDefault();

        const currentIndex = getNavigationIndex(item);

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            focusNavigationItem(currentIndex + 1);
            return;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            focusNavigationItem(currentIndex - 1);
            return;
        }

        if (event.key === "Home") {
            focusNavigationItem(0);
            return;
        }

        if (event.key === "End") {
            focusNavigationItem(
                state.navigationItems.length - 1
            );
        }
    }

    function attachNavigationKeyboardEvents() {
        state.navigationItems.forEach(function (item) {
            item.addEventListener(
                "keydown",
                handleNavigationKeyboard
            );
        });
    }

    function setupRevealElements() {
        const revealElements = Array.from(
            document.querySelectorAll(".reveal")
        );

        if (revealElements.length === 0) {
            return;
        }

        revealElements.forEach(function (element, index) {
            const delay = index * STAGGER_STEP;

            if (!element.style.getPropertyValue("--reveal-delay")) {
                element.style.setProperty(
                    "--reveal-delay",
                    delay + "ms"
                );
            }

            element.style.setProperty(
                "--stagger-delay",
                delay + "ms"
            );

            if (state.reducedMotion) {
                element.classList.add("visible");
            }
        });

        if (
            state.reducedMotion ||
            !("IntersectionObserver" in window)
        ) {
            revealElements.forEach(function (element) {
                element.classList.add("visible");
            });

            return;
        }

        const observer = new IntersectionObserver(
            function (entries, observerInstance) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add("visible");
                    observerInstance.unobserve(entry.target);
                });
            },
            {
                threshold: REVEAL_THRESHOLD,
                rootMargin: REVEAL_ROOT_MARGIN
            }
        );

        revealElements.forEach(function (element) {
            observer.observe(element);
        });
    }

    function setupCardStagger() {
        const groups = [
            ".notes-grid",
            ".important-notes-grid",
            ".rules-grid",
            ".rule-grid",
            ".notes-list",
            ".cards-grid"
        ];

        groups.forEach(function (selector) {
            const containers = Array.from(
                document.querySelectorAll(selector)
            );

            containers.forEach(function (container) {
                const cards = Array.from(
                    container.children
                );

                cards.forEach(function (card, index) {
                    const delay = index * STAGGER_STEP;

                    card.style.setProperty(
                        "--card-delay",
                        delay + "ms"
                    );

                    card.style.setProperty(
                        "--stagger-delay",
                        delay + "ms"
                    );

                    if (
                        card.classList.contains("reveal") === false &&
                        !state.reducedMotion
                    ) {
                        card.style.animationDelay =
                            delay + "ms";
                    }
                });
            });
        });
    }

    function handleImageLoad(image) {
        image.classList.add("image-loaded");
        image.classList.remove("image-loading");

        const parent = image.closest(
            ".hero-gavel, .gavel-icon, .image-wrapper, .card-image"
        );

        if (parent) {
            parent.classList.add("has-loaded-image");
        }
    }

    function handleImageError(image) {
        image.classList.add("image-error");
        image.classList.remove("image-loading");

        const parent = image.closest(
            ".hero-gavel, .gavel-icon, .image-wrapper, .card-image"
        );

        if (parent) {
            parent.classList.add("has-image-error");
        }
    }

    function setupImageDetection() {
        const images = Array.from(
            document.querySelectorAll("img")
        );

        images.forEach(function (image) {
            image.classList.add("image-loading");

            if (image.complete) {
                if (image.naturalWidth > 0) {
                    handleImageLoad(image);
                } else {
                    handleImageError(image);
                }

                return;
            }

            image.addEventListener(
                "load",
                function () {
                    handleImageLoad(image);
                },
                {
                    once: true
                }
            );

            image.addEventListener(
                "error",
                function () {
                    handleImageError(image);
                },
                {
                    once: true
                }
            );
        });
    }

    function getParallaxTargets() {
        const targets = [];

        const heroElements = Array.from(
            document.querySelectorAll(".hero")
        );

        const gavelElements = Array.from(
            document.querySelectorAll(".hero-gavel")
        );

        heroElements.forEach(function (element) {
            if (targets.indexOf(element) === -1) {
                targets.push(element);
            }
        });

        gavelElements.forEach(function (element) {
            if (targets.indexOf(element) === -1) {
                targets.push(element);
            }
        });

        return targets;
    }

    function shouldEnableParallax() {
        if (state.reducedMotion) {
            return false;
        }

        return window.innerWidth > MOBILE_PARALLAX_BREAKPOINT;
    }

    function updateParallaxFrame() {
        state.parallaxFrame = null;

        if (!state.parallaxEnabled) {
            return;
        }

        const targets = getParallaxTargets();

        if (targets.length === 0) {
            return;
        }

        const normalizedX = state.pointerX / window.innerWidth;
        const normalizedY = state.pointerY / window.innerHeight;

        const offsetX = (normalizedX - 0.5) * 2;
        const offsetY = (normalizedY - 0.5) * 2;

        targets.forEach(function (element) {
            if (element.classList.contains("hero")) {
                const x = offsetX * 5;
                const y = offsetY * 4;

                element.style.setProperty(
                    "--parallax-x",
                    x.toFixed(3) + "px"
                );

                element.style.setProperty(
                    "--parallax-y",
                    y.toFixed(3) + "px"
                );
            }

            if (element.classList.contains("hero-gavel")) {
                const x = offsetX * 12;
                const y = offsetY * 9;
                const rotateX = offsetY * -3;
                const rotateY = offsetX * 4;

                element.style.setProperty(
                    "--parallax-gavel-x",
                    x.toFixed(3) + "px"
                );

                element.style.setProperty(
                    "--parallax-gavel-y",
                    y.toFixed(3) + "px"
                );

                element.style.setProperty(
                    "--parallax-rotate-x",
                    rotateX.toFixed(3) + "deg"
                );

                element.style.setProperty(
                    "--parallax-rotate-y",
                    rotateY.toFixed(3) + "deg"
                );
            }
        });
    }

    function handlePointerMove(event) {
        if (!state.parallaxEnabled) {
            return;
        }

        state.pointerX = event.clientX;
        state.pointerY = event.clientY;

        if (state.parallaxFrame !== null) {
            return;
        }

        state.parallaxFrame = window.requestAnimationFrame(
            updateParallaxFrame
        );
    }

    function resetParallax() {
        const targets = getParallaxTargets();

        targets.forEach(function (element) {
            element.style.removeProperty("--parallax-x");
            element.style.removeProperty("--parallax-y");
            element.style.removeProperty(
                "--parallax-gavel-x"
            );
            element.style.removeProperty(
                "--parallax-gavel-y"
            );
            element.style.removeProperty(
                "--parallax-rotate-x"
            );
            element.style.removeProperty(
                "--parallax-rotate-y"
            );
        });
    }

    function updateParallaxState() {
        const shouldEnable = shouldEnableParallax();

        if (shouldEnable === state.parallaxEnabled) {
            return;
        }

        state.parallaxEnabled = shouldEnable;

        if (!state.parallaxEnabled) {
            resetParallax();
        }
    }

    function setupParallax() {
        state.parallaxEnabled = shouldEnableParallax();

        document.addEventListener(
            "pointermove",
            handlePointerMove,
            {
                passive: true
            }
        );

        window.addEventListener(
            "resize",
            function () {
                updateParallaxState();
            },
            {
                passive: true
            }
        );

        window.addEventListener(
            "blur",
            function () {
                resetParallax();
            }
        );
    }

    function setupSmoothInternalLinks() {
        const links = Array.from(
            document.querySelectorAll("a[href^='#']")
        );

        links.forEach(function (link) {
            const href = link.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            const targetId = href.substring(1).trim();

            if (!targetId) {
                return;
            }

            const target = getPanel(targetId);

            if (!target) {
                return;
            }

            if (state.navigationItems.indexOf(link) !== -1) {
                return;
            }

            link.addEventListener("click", function (event) {
                event.preventDefault();

                showPanel(targetId, {
                    updateHash: true,
                    scroll: true,
                    focus: false
                });
            });
        });
    }

    function setupLogoScroll() {
        const logoCandidates = Array.from(
            document.querySelectorAll(
                ".logo, .brand, .navbar-brand, .site-logo, [data-logo]"
            )
        );

        logoCandidates.forEach(function (logo) {
            logo.addEventListener("click", function (event) {
                const href = logo.getAttribute("href");

                if (href && href !== "#") {
                    return;
                }

                event.preventDefault();

                try {
                    window.history.replaceState(
                        null,
                        "",
                        window.location.pathname +
                        window.location.search
                    );
                } catch (error) {
                    /* History API may be unavailable in restricted contexts. */
                }

                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: state.reducedMotion
                        ? "auto"
                        : "smooth"
                });
            });
        });
    }

    function setupCurrentYear() {
        const currentYear = new Date().getFullYear();

        const yearElements = Array.from(
            document.querySelectorAll("[data-current-year]")
        );

        yearElements.forEach(function (element) {
            element.textContent = String(currentYear);
        });
    }

    function setupEscapeNavigation() {
        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }

            const activeElement = document.activeElement;

            if (
                activeElement &&
                activeElement.matches(
                    "input, textarea, select"
                )
            ) {
                return;
            }

            const openModal = document.querySelector(
                ".modal.is-open, .modal.active, [role='dialog'].is-open, [role='dialog'].active"
            );

            if (openModal) {
                closeModal(openModal);
            }
        });
    }

    function openModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.add("is-open");
        modal.classList.add("active");

        modal.removeAttribute("hidden");
        modal.setAttribute("aria-hidden", "false");

        document.body.classList.add("modal-open");

        const closeButton = modal.querySelector(
            "[data-modal-close], .modal-close, .close-modal, [aria-label='Close']"
        );

        if (closeButton) {
            window.setTimeout(function () {
                try {
                    closeButton.focus({
                        preventScroll: true
                    });
                } catch (error) {
                    closeButton.focus();
                }
            }, 0);
        }
    }

    function closeModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.remove("is-open");
        modal.classList.remove("active");

        modal.setAttribute("aria-hidden", "true");

        if (modal.hasAttribute("data-modal-hidden")) {
            modal.setAttribute("hidden", "");
        }

        const remainingOpenModals = document.querySelectorAll(
            ".modal.is-open, .modal.active, [role='dialog'].is-open, [role='dialog'].active"
        );

        if (remainingOpenModals.length === 0) {
            document.body.classList.remove("modal-open");
        }
    }

    function setupModals() {
        const modalTriggers = Array.from(
            document.querySelectorAll(
                "[data-modal-target], [data-open-modal]"
            )
        );

        modalTriggers.forEach(function (trigger) {
            trigger.addEventListener("click", function (event) {
                event.preventDefault();

                const targetId =
                    trigger.getAttribute("data-modal-target") ||
                    trigger.getAttribute("data-open-modal");

                if (!targetId) {
                    return;
                }

                const modal = getPanel(targetId);

                if (!modal) {
                    return;
                }

                openModal(modal);
            });
        });

        const closeButtons = Array.from(
            document.querySelectorAll(
                "[data-modal-close], .modal-close, .close-modal"
            )
        );

        closeButtons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();

                const modal =
                    button.closest(".modal") ||
                    button.closest("[role='dialog']");

                closeModal(modal);
            });
        });

        const modalOverlays = Array.from(
            document.querySelectorAll(
                ".modal-overlay, .modal-backdrop"
            )
        );

        modalOverlays.forEach(function (overlay) {
            overlay.addEventListener("click", function (event) {
                if (event.target !== overlay) {
                    return;
                }

                const modal =
                    overlay.closest(".modal") ||
                    overlay.closest("[role='dialog']");

                closeModal(modal);
            });
        });
    }

    function setupExternalNavigationFallback() {
        const allLinks = Array.from(
            document.querySelectorAll("a[href]")
        );

        allLinks.forEach(function (link) {
            const href = link.getAttribute("href");

            if (!href) {
                return;
            }

            if (href.indexOf("#") === 0) {
                return;
            }

            if (href.indexOf("javascript:") === 0) {
                return;
            }

            link.addEventListener("click", function () {
                link.classList.add("navigation-loading");
            });
        });
    }

    function setupPanelAccessibility() {
        state.panels.forEach(function (panel) {
            if (!panel.hasAttribute("aria-labelledby")) {
                const matchingNavigation = state.navigationItems.find(
                    function (item) {
                        return getPanelIdFromElement(item) === panel.id;
                    }
                );

                if (
                    matchingNavigation &&
                    matchingNavigation.id
                ) {
                    panel.setAttribute(
                        "aria-labelledby",
                        matchingNavigation.id
                    );
                }
            }
        });
    }

    function setupResizeHandling() {
        window.addEventListener(
            "resize",
            function () {
                if (state.resizeTimer) {
                    window.clearTimeout(state.resizeTimer);
                }

                state.resizeTimer = window.setTimeout(
                    function () {
                        updateParallaxState();
                    },
                    120
                );
            },
            {
                passive: true
            }
        );
    }

    function setupVisibilityRefresh() {
        document.addEventListener(
            "visibilitychange",
            function () {
                if (document.hidden) {
                    resetParallax();
                    return;
                }

                updateParallaxState();
            }
        );
    }

    function initializePanels() {
        collectPanels();
        collectNavigationItems();

        if (state.panels.length === 0) {
            return;
        }

        setupPanelAccessibility();

        const initialPanelId = findInitialPanel();

        if (initialPanelId) {
            showPanel(initialPanelId, {
                updateHash: Boolean(
                    window.location.hash
                ),
                scroll: false,
                focus: false
            });
        }
    }

    function initialize() {
        initializePanels();

        attachNavigationEvents();
        attachNavigationKeyboardEvents();

        setupSmoothInternalLinks();
        setupLogoScroll();
        setupCurrentYear();

        setupRevealElements();
        setupCardStagger();

        setupImageDetection();

        setupParallax();
        setupResizeHandling();
        setupVisibilityRefresh();

        setupEscapeNavigation();
        setupModals();

        setupExternalNavigationFallback();

        window.dispatchEvent(
            new CustomEvent("kira:ready", {
                detail: {
                    panels: state.panels,
                    navigationItems: state.navigationItems,
                    currentPanelId: state.currentPanelId
                }
            })
        );
    }

    window.KIRAAuction = {
        showPanel: showPanel,
        getPanel: getPanel,
        openModal: openModal,
        closeModal: closeModal,
        getState: function () {
            return {
                currentPanelId: state.currentPanelId,
                panels: state.panels.slice(),
                navigationItems: state.navigationItems.slice(),
                parallaxEnabled: state.parallaxEnabled,
                reducedMotion: state.reducedMotion
            };
        }
    };

    initialize();
});
