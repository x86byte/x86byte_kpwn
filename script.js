document.addEventListener('DOMContentLoaded', () => {

    // --- Custom Cursor Logic (Translated from React Example - NEW) ---
    const cursorFollower = document.getElementById('cursor-follower'); // Red circle using .custom-cursor style
    const cursorDot = document.getElementById('cursor-dot');         // White dot using .cursor-dot style

    if (!cursorFollower || !cursorDot) {
        console.error("Custom cursor elements not found (#cursor-follower or #cursor-dot).");
        document.body.style.cursor = 'auto'; // Restore default cursor
    } else {
        let isCursorVisible = false;
        let dotTimer = null; // To store the setTimeout ID

        // Follower dimensions from CSS (update if CSS changes)
        const followerWidth = 20 + (2 * 2); // diameter + border * 2
        const followerHeight = 20 + (2 * 2);
        // Dot dimensions from CSS
        const dotWidth = 4;
        const dotHeight = 4;

        function onMouseMove(e) {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Make cursor visible on first move
            if (!isCursorVisible) {
                cursorFollower.style.opacity = '1';
                cursorDot.style.opacity = '1';
                isCursorVisible = true;
            }

            // 1. Update Red Circle Position IMMEDIATELY
            // Center the element by subtracting half its calculated size
            cursorFollower.style.left = `${mouseX - followerWidth / 2}px`;
            cursorFollower.style.top = `${mouseY - followerHeight / 2}px`;

            // 2. Schedule White Dot Update after 50ms
            clearTimeout(dotTimer); // Clear previous timer
            dotTimer = setTimeout(() => {
                // Center the element by subtracting half its calculated size
                cursorDot.style.left = `${mouseX - dotWidth / 2}px`;
                cursorDot.style.top = `${mouseY - dotHeight / 2}px`;
            }, 50); // 50ms delay
        }

        // Attach listener
        document.addEventListener('mousemove', onMouseMove, { passive: true });

    } // End if elements exist


    // --- Like Buttons Logic ---
    const likeButtons = document.querySelectorAll('.like-button');
    const likedPostsKey = 'x86byte_liked_posts';
    let likedPosts = {};
    try { likedPosts = JSON.parse(localStorage.getItem(likedPostsKey)) || {}; }
    catch (e) { console.error("Error parsing liked posts:", e); likedPosts = {}; }

    likeButtons.forEach(button => {
        const postId = button.dataset.postId; if (!postId) return;
        const countSpan = button.querySelector('.like-count'); if (!countSpan) return;
        let currentLikes = parseInt(countSpan.textContent || '0');
        if (likedPosts[postId]) { button.classList.add('liked'); button.disabled = true; }
        button.addEventListener('click', () => {
            if (!likedPosts[postId]) {
                currentLikes++; countSpan.textContent = currentLikes;
                button.classList.add('liked'); button.disabled = true;
                likedPosts[postId] = true;
                try { localStorage.setItem(likedPostsKey, JSON.stringify(likedPosts)); }
                catch (e) { console.error("Error saving like status:", e); }
                console.log(`Liked post: ${postId} (Client-side only)`);
            }
        });
    });


    // --- Mini Shell Logic ---
    const shellOutput = document.getElementById('shell-output');
    const shellInput = document.getElementById('shell-input');
    const shellPrompt = document.getElementById('shell-prompt');
    const miniShell = document.getElementById('mini-shell');

    function getCurrentPathFromURL() { /* ... (same as before) ... */
        const path = window.location.pathname.toLowerCase();
        const filename = path.substring(path.lastIndexOf('/') + 1);
        if (filename === '' || filename === 'index.html') return '/';
        if (filename === 'about.html') return '/about';
        if (filename === 'contact.html') return '/contact';
        if (filename === 'community.html') return '/community';
        if (path.includes('/articles')) return '/articles';
        return path;
    }
    let currentPath = getCurrentPathFromURL();
    let commandHistory = []; let historyIndex = -1;
    function updatePrompt() { if (shellPrompt) shellPrompt.textContent = `x86byte_kpwn:${currentPath}$`; }
    function printToShell(text, type = 'output') { /* ... (same as before) ... */
         if (shellOutput) {
            const line = document.createElement('div');
            line.textContent = text; // Use textContent for security
            line.className = type;
            shellOutput.appendChild(line);
            miniShell.scrollTop = miniShell.scrollHeight;
        }
    }
    function executeCommand(command) { /* ... (same as before, no changes needed here) ... */
        const parts = command.trim().split(' ').filter(p => p !== '');
        const cmd = parts[0]?.toLowerCase();
        const args = parts.slice(1);
        printToShell(`${shellPrompt?.textContent || '$'} ${command}`, 'command');
        if (command) { commandHistory.push(command); historyIndex = commandHistory.length; }
        switch (cmd) {
            case 'help': printToShell('Available: help, ls, cd, pwd, cat, goto, clear, date'); break;
            case 'ls': if (currentPath === '/') printToShell('about contact community articles/'); else if (currentPath === '/articles') printToShell('advanced_buffer_overflow.md\nsecure_code_review.md\nweb3_security.md'); else printToShell(''); break;
            case 'pwd': printToShell(currentPath); break;
            case 'cd':
                let targetUrl = null, targetPath = null;
                if (args.length === 0 || args[0] === '/' || args[0] === '~') { targetUrl = 'index.html'; targetPath = '/'; }
                else if (args[0] === '..') { if (currentPath !== '/') { targetUrl = 'index.html'; targetPath = '/'; } else { targetPath = '/'; } }
                else { const targetDir = args[0].replace(/\/$/, ''); if (currentPath === '/') { if (targetDir === 'about') { targetUrl = 'about.html'; targetPath = '/about'; } else if (targetDir === 'contact') { targetUrl = 'contact.html'; targetPath = '/contact'; } else if (targetDir === 'community') { targetUrl = 'community.html'; targetPath = '/community'; } else if (targetDir === 'articles') { targetPath = '/articles'; } else { printToShell(`cd: No such file or directory: ${targetDir}`, 'error'); } } else { printToShell(`cd: Cannot navigate from ${currentPath}`, 'error'); } }
                if (targetUrl) { window.location.href = targetUrl; } else if (targetPath && targetPath !== currentPath) { currentPath = targetPath; updatePrompt(); } else { updatePrompt(); } break;
            case 'cat': if (currentPath === '/articles' && args.length > 0) printToShell(`Reading '${args[0]}' is not implemented yet.`); else if (args.length > 0) printToShell(`cat: '${args[0]}': Not a readable file here`, 'error'); else printToShell('cat: Missing filename', 'error'); break;
            case 'goto': if (args.length > 0) { let url = args[0]; if (!/^(https?:)?\/\//i.test(url)) url = 'https://' + url; printToShell(`Opening ${url} in a new tab...`); try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { printToShell(`goto: Error opening URL: ${e.message}`, 'error'); } } else printToShell('goto: Missing URL', 'error'); break;
            case 'clear': if (shellOutput) shellOutput.innerHTML = ''; break;
            case 'date': printToShell(new Date().toLocaleString()); break;
            case undefined: case '': break; // Ignore empty
            default: printToShell(`command not found: ${cmd}`, 'error'); break;
        }
        if (shellInput) shellInput.focus();
    }

    if (shellInput && shellOutput && miniShell && shellPrompt) { /* ... (Shell listeners same as before) ... */
        updatePrompt(); printToShell("Welcome. Type 'help' for commands.");
        shellInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); executeCommand(shellInput.value); shellInput.value = ''; } else if (e.key === 'ArrowUp') { e.preventDefault(); if (commandHistory.length > 0) { historyIndex = Math.max(0, historyIndex - 1); shellInput.value = commandHistory[historyIndex]; setTimeout(() => shellInput.setSelectionRange(shellInput.value.length, shellInput.value.length), 0); } } else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIndex < commandHistory.length - 1) { historyIndex++; shellInput.value = commandHistory[historyIndex]; setTimeout(() => shellInput.setSelectionRange(shellInput.value.length, shellInput.value.length), 0); } else { historyIndex = commandHistory.length; shellInput.value = ''; } } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); executeCommand('clear'); } });
        miniShell.addEventListener('click', (e) => { if (e.target !== shellInput) shellInput.focus(); });
        shellInput.focus();
    } else { console.error("Mini-shell HTML elements not found."); }

}); // End DOMContentLoaded