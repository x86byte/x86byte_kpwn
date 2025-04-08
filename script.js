document.addEventListener('DOMContentLoaded', () => {

    const cursorFollower = document.getElementById('cursor-follower');

    if (!cursorFollower) {
        console.error("Cursor follower element (#cursor-follower) not found.");
        document.body.style.cursor = 'auto';
    } else {
        let mouseX = -100, mouseY = -100;
        let followerX = -100, followerY = -100;
        const delay = 0.2;
        let rafId = null;
        let isCursorVisible = false;

        function updateCursor() {
            if (!isNaN(mouseX) && !isNaN(mouseY)) {
                followerX += (mouseX - followerX) * delay;
                followerY += (mouseY - followerY) * delay;
            }
            cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
            rafId = requestAnimationFrame(updateCursor);
        }

        function onMouseMove(e) {
            mouseX = e.clientX; mouseY = e.clientY;
            if (!isCursorVisible) {
                cursorFollower.style.opacity = '1'; isCursorVisible = true;
                if (!rafId) {
                    followerX = mouseX; followerY = mouseY;
                    updateCursor();
                }
            }
        }
        document.addEventListener('mousemove', onMouseMove, { passive: true });

    }


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


    const shellOutput = document.getElementById('shell-output');
    const shellInput = document.getElementById('shell-input');
    const shellPrompt = document.getElementById('shell-prompt');
    const miniShell = document.getElementById('mini-shell');

    function getCurrentPathFromURL() {
        const path = window.location.pathname.toLowerCase();
        const filename = path.substring(path.lastIndexOf('/') + 1);

        if (filename === '' || filename === 'index.html') return '/';
        if (filename === 'about.html') return '/about';
        if (filename === 'contact.html') return '/contact';
        if (filename === 'community.html') return '/community';
        // Check if inside articles directory
        if (path.includes('/articles/')) {
            if (filename === 're-ma-roadmap.html') return '/articles/re-ma-roadmap'; // Simplified path
            // Add more else if for other articles
            return '/articles'; // Default if specific article not recognized
        }
        return path; // Fallback
    }


    
    let currentPath = getCurrentPathFromURL();
    let commandHistory = []; let historyIndex = -1;

    function updatePrompt() {
        if (shellPrompt) shellPrompt.textContent = `x86byte_kpwn:${currentPath}$`;
    }

    function printToShell(text, type = 'output') {
         if (shellOutput) { const line = document.createElement('div'); line.textContent = text; line.className = type; shellOutput.appendChild(line); miniShell.scrollTop = miniShell.scrollHeight; }
    }




    
     function executeCommand(command) {
        const parts = command.trim().split(' ').filter(p => p !== ''); const cmd = parts[0]?.toLowerCase(); const args = parts.slice(1);
        printToShell(`${shellPrompt?.textContent || '$'} ${command}`, 'command');
        if (command) { commandHistory.push(command); historyIndex = commandHistory.length; }

        switch (cmd) {
            case 'help': printToShell('Available: help, ls, cd, pwd, cat, goto, clear, date'); break;
            case 'ls':
                if (currentPath === '/') printToShell('about contact community articles/');
                // UPDATED ls for /articles
                else if (currentPath === '/articles' || currentPath.startsWith('/articles/')) {
                     printToShell('re-ma-roadmap'); // List the article file/slug
                }
                else printToShell(''); // Empty for other pages like /about
                break;
            case 'pwd': printToShell(currentPath); break;
            case 'cd':
                let targetUrl = null, targetPath = null;
                const currentBase = currentPath.split('/')[1] || ''; // e.g., 'articles', 'about', or '' for root

                if (args.length === 0 || args[0] === '/' || args[0] === '~') { targetUrl = 'index.html'; targetPath = '/'; }
                else if (args[0] === '..') {
                    // If in an article or /articles, go to root
                    if (currentBase === 'articles') { targetUrl = '../index.html'; targetPath = '/'; }
                    // If in /about, /contact, /community, go to root
                    else if (currentPath !== '/') { targetUrl = 'index.html'; targetPath = '/'; }
                    else { targetPath = '/'; } // Already at root
                }
                else {
                    const targetDir = args[0].replace(/\/$/, '');
                    if (currentPath === '/') { // From root
                        if (targetDir === 'about') { targetUrl = 'about.html'; targetPath = '/about'; }
                        else if (targetDir === 'contact') { targetUrl = 'contact.html'; targetPath = '/contact'; }
                        else if (targetDir === 'community') { targetUrl = 'community.html'; targetPath = '/community'; }
                        else if (targetDir === 'articles') { targetPath = '/articles'; } // Go to virtual articles dir
                        else { printToShell(`cd: No such file or directory: ${targetDir}`, 'error'); }
                    }
                    // UPDATED: Allow cd into specific article from /articles
                    else if (currentPath === '/articles') {
                         if (targetDir === 're-ma-roadmap') { targetUrl = 're-ma-roadmap.html'; targetPath = '/articles/re-ma-roadmap'; }
                         // Add else if for future articles
                         else { printToShell(`cd: No such article: ${targetDir}`, 'error'); }
                    }
                    else { printToShell(`cd: Cannot navigate from ${currentPath}`, 'error'); }
                }
                // Navigation logic
                if (targetUrl) {
                     // Adjust URL based on current location for relative paths
                     if (currentPath.includes('/articles/')) { // If currently in an article
                         window.location.href = `../${targetUrl}`; // Need to go up one level first
                     } else {
                         window.location.href = targetUrl;
                     }
                } else if (targetPath && targetPath !== currentPath) {
                    currentPath = targetPath; updatePrompt();
                } else { updatePrompt(); } // Ensure prompt updates
                break;
             // UPDATED: cat command to navigate
            case 'cat':
                if ((currentPath === '/articles' || currentPath.startsWith('/articles/')) && args.length > 0) {
                    const slug = args[0].replace('.html', '').replace('.md', ''); // Be flexible
                    if (slug === 're-ma-roadmap') {
                        // If already there, maybe just print a message?
                        if (currentPath === '/articles/re-ma-roadmap') {
                             printToShell('You are already viewing this article.');
                        } else {
                             printToShell('Navigating to re-ma-roadmap...');
                             window.location.href = 're-ma-roadmap.html'; // Navigate if in /articles
                        }
                    }
                    // Add else if for future articles
                    else { printToShell(`cat: Unknown article: ${args[0]}`, 'error'); }
                } else if (args.length > 0) { printToShell(`cat: Cannot read '${args[0]}' from ${currentPath}`, 'error'); }
                else { printToShell('cat: Missing filename', 'error'); }
                break;
            case 'goto': /* ... (same as before) ... */ if (args.length > 0) { let url = args[0]; if (!/^(https?:)?\/\//i.test(url)) url = 'https://' + url; printToShell(`Opening ${url} in a new tab...`); try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { printToShell(`goto: Error opening URL: ${e.message}`, 'error'); } } else printToShell('goto: Missing URL', 'error'); break;
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

});
