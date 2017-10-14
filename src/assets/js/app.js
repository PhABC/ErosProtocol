$(document).foundation();


var $root = $('html, body');
$('.menu li a').click(function () {
    var href = $.attr(this, 'href');
    $root.animate({
        scrollTop: $(href).offset().top
    }, 500, function () {
        window.location.hash = href;
    });
    return false;
});

