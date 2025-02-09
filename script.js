window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const scrollPosition = window.scrollY + window.innerHeight;
  
    sections.forEach(section => {
      if (section.offsetTop < scrollPosition) {
        section.classList.add('visible');
      }
    });
  });
  