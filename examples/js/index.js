document.addEventListener('DOMContentLoaded', () => {
    // Loading Progress
    const progressBar = document.querySelector('.progress-bar');
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += 1;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(loadingInterval);
            document.getElementById('loadingProgress').style.display = 'none';
        }
    }, 20);

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        themeToggle.querySelector('i').className = 
            newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        
        // 更新图标
        const icon = sidebarToggle.querySelector('i');
        if (sidebar.classList.contains('collapsed')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-bars-staggered');
        } else {
            icon.classList.remove('fa-bars-staggered');
            icon.classList.add('fa-bars');
        }
    });

    // Search Functionality
    const searchInput = document.getElementById('searchInput');
    const componentCards = document.querySelectorAll('.component-card');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            componentCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                card.style.display = title.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }

    // Filter Tags
    const filterTags = document.querySelectorAll('.filter-tags .tag');
    if (filterTags) {
        filterTags.forEach(tag => {
            tag.addEventListener('click', () => {
                filterTags.forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                const filter = tag.getAttribute('data-filter');
                
                componentCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else {
                        const cardType = card.getAttribute('data-type');
                        card.style.display = cardType === filter ? 'block' : 'none';
                    }
                });
            });
        });
    }

    // Back to Top Button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Breadcrumb Navigation
    const updateBreadcrumb = () => {
        const sections = document.querySelectorAll('.component-section');
        const breadcrumb = document.getElementById('breadcrumb');
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100) {
                currentSection = section.querySelector('h2').textContent;
            }
        });
        
        if (currentSection) {
            breadcrumb.innerHTML = `
                <span>首页</span>
                <span>${currentSection}</span>
            `;
        }
    };
    
    window.addEventListener('scroll', updateBreadcrumb);

    // 处理组件卡片的点击事件
    function initializeComponentCards() {
        const componentCards = document.querySelectorAll('.component-card');
        const previewModal = document.getElementById('previewModal');
        const closeModal = document.querySelector('.close-modal');

        if (previewModal && closeModal) {
            // 双击事件处理函数
            function handleDoubleClick(card) {
                const preview = card.querySelector('.component-preview').cloneNode(true);
                const title = card.querySelector('h3').textContent;
                const description = card.getAttribute('data-description') || '暂无描述';
                const codeExample = card.getAttribute('data-code') || '// 示例代码';
                
                previewModal.querySelector('.preview-container').innerHTML = '';
                previewModal.querySelector('.preview-container').appendChild(preview);
                previewModal.querySelector('.component-title').textContent = title;
                previewModal.querySelector('.component-description').textContent = description;
                previewModal.querySelector('code').textContent = codeExample;
                
                previewModal.style.display = 'block';
                Prism.highlightAll();
            }

            // 为每个卡片添加双击事件
            componentCards.forEach(card => {
                card.addEventListener('dblclick', () => handleDoubleClick(card));
            });
            
            // 关闭预览模态框
            closeModal.addEventListener('click', () => {
                previewModal.style.display = 'none';
            });
        }
    }

    initializeComponentCards();

    // Copy Code Button
    const copyButton = document.querySelector('.copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const code = document.querySelector('.code-example code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
    }

    // Lazy Loading
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    componentCards.forEach(card => {
        card.classList.add('lazy-load');
        observer.observe(card);
    });

    // Handle sidebar navigation with smooth scrolling
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    if (sidebarLinks) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                    
                    sidebarLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
    }

    // Update active section on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.component-section');
        let currentSectionId = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 200) {
                currentSectionId = '#' + section.id;
            }
        });
        
        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === currentSectionId);
        });
    });

    // Add hover effects to component cards
    componentCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
});
