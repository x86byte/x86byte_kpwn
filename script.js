document.addEventListener('DOMContentLoaded', () => {

    const cursorFollower = document.getElementById('cursor-follower');

    if (!cursorFollower) {
        console.error("Cursor follower element (#cursor-follower) not found.");
        document.body.style.cursor = 'auto';
    } else {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let followerX = mouseX;
        let followerY = mouseY;
        // --- INCREASE THIS VALUE FOR FASTER RESPONSE ---
        const delay = 0.35; // Changed for faster response. Adjust 0.35 as needed (e.g., 0.4, 0.5)
        // --- YOU CAN TWEAK 0.35 ---

        let rafId = null;
        let isCursorActive = false;

        cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
        cursorFollower.style.opacity = '0';

        function updateCursor() {
            if (isCursorActive) {
                followerX += (mouseX - followerX) * delay;
                followerY += (mouseY - followerY) * delay;
                cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
            }
            rafId = requestAnimationFrame(updateCursor);
        }

        function onMouseMove(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!isCursorActive) {
                cursorFollower.style.opacity = '1';
                isCursorActive = true;
                if (!rafId) {
                    updateCursor();
                }
            }
        }

        // Optional: Hide cursor when mouse leaves window (uncomment if desired)
        // function onMouseLeave() {
        //    cursorFollower.style.opacity = '0';
        //    isCursorActive = false;
        // }

        document.addEventListener('mousemove', onMouseMove, { passive: true });
        // document.addEventListener('mouseleave', onMouseLeave); // Uncomment if needed

        if (!rafId) {
            updateCursor();
        }
    }

    // --- LIKE BUTTON LOGIC ---
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


    // --- MINI SHELL LOGIC ---
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
         if (shellOutput && miniShell) { // Added check for miniShell
            const line = document.createElement('div');
            line.textContent = text;
            line.className = type;
            shellOutput.appendChild(line);
            miniShell.scrollTop = miniShell.scrollHeight; // Scroll down
        }
    }

     function executeCommand(command) {
        const parts = command.trim().split(' ').filter(p => p !== '');
        const cmd = parts[0]?.toLowerCase();
        const args = parts.slice(1);

        // Use current prompt text when printing command
        const promptText = shellPrompt ? shellPrompt.textContent : '$';
        printToShell(`${promptText} ${command}`, 'command');

        if (command) { commandHistory.push(command); historyIndex = commandHistory.length; }

        switch (cmd) {
            case 'help': printToShell('Available: help, ls, cd, pwd, cat, goto, clear, date'); break;
            case 'ls':
                if (currentPath === '/') printToShell('about contact community articles/');
                else if (currentPath === '/articles' || currentPath.startsWith('/articles/')) {
                     printToShell('re-ma-roadmap');
                     printToShell('Obfusk8');
                }
                else printToShell(''); // Empty for other pages
                break;
            case 'pwd': printToShell(currentPath); break;
            case 'cd':
    let targetUrl = null, targetPath = null;
    const currentBase = currentPath.split('/')[1] || '';
    const inArticle = currentPath.startsWith('/articles/'); // Check if currently IN an article page

    if (args.length === 0 || args[0] === '/' || args[0] === '~') {
         // Go to root index.html
         targetUrl = inArticle ? '../index.html' : 'index.html'; // Adjust path based on current location
         targetPath = '/';
    } else if (args[0] === '..') {
         if (inArticle) { // If in an article, go to root
             targetUrl = '../index.html';
             targetPath = '/';
         } else if (currentPath === '/articles') { // If in /articles, go to root
             targetUrl = 'index.html'; // Already in root context for this file
             targetPath = '/';
         } else if (currentPath !== '/') { // If in /about, /contact, /community, go to root
             targetUrl = 'index.html';
             targetPath = '/';
         } else { // Already at root
             targetPath = '/';
         }
    } else {
        const targetDir = args[0].replace(/\/$/, '');
        if (currentPath === '/') { // From root
            if (targetDir === 'about') { targetUrl = 'about.html'; targetPath = '/about'; }
            else if (targetDir === 'contact') { targetUrl = 'contact.html'; targetPath = '/contact'; }
            else if (targetDir === 'community') { targetUrl = 'community.html'; targetPath = '/community'; }
            else if (targetDir === 'articles') { targetPath = '/articles'; } // Go to virtual articles dir
            else { printToShell(`cd: No such file or directory: ${targetDir}`, 'error'); }
        } else if (currentPath === '/articles') { // From /articles directory (virtual)
             if (targetDir === 're-ma-roadmap') {
                 // Navigate TO the article page RELATIVE to index.html
                 targetUrl = 'articles/re-ma-roadmap.html';
                 targetPath = '/articles/re-ma-roadmap';
             } else if (targetDir === 'Obfusk8'){
                targetUrl = 'articles/Obfusk8.html';
                 targetPath = '/articles/Obfusk8';
             }
             // Add else if for future articles
             else { printToShell(`cd: No such article: ${targetDir}`, 'error'); }
        } else if (inArticle) { // From within an article page
            printToShell(`cd: Use 'cd ..' to leave article`, 'error');
        }
         else { // From /about, /contact, /community
            printToShell(`cd: Cannot navigate directly from ${currentPath} to ${targetDir}`, 'error');
        }
    }

    // Navigation logic
    if (targetUrl) {
         window.location.href = targetUrl; // Navigate
    } else if (targetPath !== null && targetPath !== currentPath) {
        currentPath = targetPath;
        updatePrompt();
        // Optional message: printToShell(`Changed directory to ${currentPath}`);
    }
    break;

 case 'cat':
     let catTargetUrl = null;
     if (args.length > 0) {
         const slug = args[0].replace('.html', '').replace('.md', '');
         const inArticle = currentPath.startsWith('/articles/');

         if (slug === 're-ma-roadmap') {
            if (currentPath !== '/articles/re-ma-roadmap') {
                // Determine correct relative path based on CURRENT location
                catTargetUrl = inArticle ? '../articles/re-ma-roadmap.html' : 'articles/re-ma-roadmap.html';
                printToShell('Navigating to re-ma-roadmap...');
            } else {
                 printToShell('You are already viewing this article.');
            }
         } else if (slug === 'Obfusk8') {
            if (currentPath !== '/articles/Obfusk8p') {
                // Determine correct relative path based on CURRENT location
                catTargetUrl = inArticle ? '../articles/Obfusk8.html' : 'articles/Obfusk8.html';
                printToShell('Navigating to Obfusk8...');
            } else {
                 printToShell('You are already viewing this article.');
            }
         }
         // Add else if for future articles
         else { printToShell(`cat: Unknown article or not in articles directory: ${args[0]}`, 'error'); }
     } else { printToShell('cat: Missing filename', 'error'); }

     if (catTargetUrl) { window.location.href = catTargetUrl; }
     break;
            case 'goto':
                 if (args.length > 0) {
                     let url = args[0];
                     if (!/^(https?:)?\/\//i.test(url)) { url = 'https://' + url; }
                     printToShell(`Opening ${url} in a new tab...`);
                     try { window.open(url, '_blank', 'noopener,noreferrer'); }
                     catch (e) { printToShell(`goto: Error opening URL: ${e.message}`, 'error'); }
                 } else { printToShell('goto: Missing URL', 'error'); }
                 break;
            case 'clear': if (shellOutput) shellOutput.innerHTML = ''; break;
            case 'date': printToShell(new Date().toLocaleString()); break;
            case undefined: case '': break; // Ignore empty
            default: printToShell(`command not found: ${cmd}`, 'error'); break;
        }
        if (shellInput) shellInput.focus(); // Keep focus on input
    }

    if (shellInput && shellOutput && miniShell && shellPrompt) {
        updatePrompt();
        printToShell("Welcome. Type 'help' for commands.");
        shellInput.addEventListener('keydown', (e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 executeCommand(shellInput.value);
                 shellInput.value = '';
            } else if (e.key === 'ArrowUp') {
                 e.preventDefault();
                 if (commandHistory.length > 0) {
                     historyIndex = Math.max(0, historyIndex - 1);
                     shellInput.value = commandHistory[historyIndex];
                     // Move cursor to end
                     setTimeout(() => shellInput.setSelectionRange(shellInput.value.length, shellInput.value.length), 0);
                 }
            } else if (e.key === 'ArrowDown') {
                 e.preventDefault();
                 if (historyIndex < commandHistory.length - 1) {
                     historyIndex++;
                     shellInput.value = commandHistory[historyIndex];
                     // Move cursor to end
                     setTimeout(() => shellInput.setSelectionRange(shellInput.value.length, shellInput.value.length), 0);
                 } else {
                     historyIndex = commandHistory.length;
                     shellInput.value = '';
                 }
            } else if (e.key === 'l' && e.ctrlKey) { // Ctrl+L for clear
                 e.preventDefault();
                 executeCommand('clear');
            }
         });
        // Refocus input if user clicks inside the shell but not on the input itself
        miniShell.addEventListener('click', (e) => {
            if (e.target !== shellInput) {
                shellInput.focus();
            }
        });
        shellInput.focus(); // Initial focus
    } else {
        console.error("Mini-shell HTML elements not found or incomplete.");
    }

}); // End of DOMContentLoaded
