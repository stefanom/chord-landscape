import re

PATH = "[...document.querySelectorAll('#path .chip b')].map(b => b.textContent).join(' ')"


def path(page):
    return page.evaluate(PATH)


def group(name):
    """The options listed under one kind of move."""
    return f'#compass .verb:has(.verb-h b:text-is("{name}")) .opt'


def stop(page):
    if 'Stop' in page.inner_text('#play'):
        page.click('#play')


def test_starts_at_home(page):
    assert path(page) == 'C'
    assert page.inner_text('#here-name') == 'C'
    assert page.inner_text('#here-job').lower() == 'home'
    assert page.locator('#compass .verb').count() >= 8


def test_a_move_joins_the_path_and_undo_takes_it_back(page):
    page.click(group('Follow the road') + ' >> nth=0')
    assert path(page) == 'C F'
    assert page.inner_text('#here-name') == 'F'
    page.click('#undo')
    assert path(page) == 'C'
    assert page.is_disabled('#undo')


def test_a_chord_can_be_removed_from_the_middle(page):
    page.click('#seeds [data-seed="0"]')
    stop(page)
    assert path(page) == 'C G Am F'
    page.click('#path .chip >> nth=1')
    page.click('.chip-x')
    assert path(page) == 'C Am F'
    page.keyboard.press('Control+z')
    assert path(page) == 'C G Am F'


def test_replacing_the_chord_after_the_selected_one(page):
    page.click('#seeds [data-seed="0"]')
    stop(page)
    page.click('#path .chip >> nth=0')
    page.click(group('Borrow from minor') + ':has(b:text-is("A♭"))')
    assert path(page) == 'C A♭ Am F'


def test_the_three_maps_draw_and_mark_where_you_are(page):
    page.click('#seeds [data-seed="4"]')
    stop(page)
    for lens in ('roads', 'wheel', 'lattice'):
        page.click(f'#lens-tabs [data-lens={lens}]')
        assert page.locator('#map .st.cur').count() >= 1, lens
        assert page.locator('#map .trail').count() >= 1, lens
        assert page.locator('#map *').count() > 40, lens


def test_chords_never_overlap_on_the_roads_map(page):
    overlaps = """() => {
      const c = [...document.querySelectorAll('#map g.st circle')].map(e => [+e.getAttribute('cx'), +e.getAttribute('cy'), +e.getAttribute('r')]);
      const bad = [];
      c.forEach((a, i) => c.slice(i + 1).forEach(b => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < a[2] + b[2] - 0.5) bad.push([a, b]); }));
      return { chords: c.length, bad };
    }"""
    def check(where):
        got = page.evaluate(overlaps)
        assert got['chords'] >= 19, where
        assert got['bad'] == [], where

    check('home, major')
    page.click(group('Follow the road') + ':has(b:text-is("G"))')
    check('on V')
    page.click(group('Slide a half step') + ' >> nth=0')
    check('after a slide')
    page.click('#rich-on')
    check('sevenths')
    page.click('#mode-minor')
    check('home, minor')
    page.click(group('Follow the road') + ' >> nth=3')
    check('minor, on V')
    page.select_option('#key', '8')
    page.click('#seeds [data-seed="7"]')
    stop(page)
    check('borrowed chords in A flat')


def test_playback_is_followed_on_the_map(page):
    page.evaluate("(() => { const t = document.getElementById('tempo'); t.value = 140; t.dispatchEvent(new Event('input')); })()")
    page.click('#loop')
    page.click('#seeds [data-seed="4"]')
    page.wait_for_selector('#map[data-live="1"] .st.cur')
    page.wait_for_selector('#path .chip.playing')
    page.wait_for_function("document.getElementById('here-name').textContent === 'E7'")
    assert page.locator('#map .dest').count() == 0
    page.click('#play')
    assert page.get_attribute('#map', 'data-live') == '0'
    assert page.locator('#map .dest').count() > 5


def test_one_finger_moves_a_half_step(page):
    page.click('#voices [data-nudge="3,1"]')
    assert path(page) == 'C C+'
    page.click('#voices [data-nudge="3,1"]')
    assert path(page) == 'C C+ C6'
    page.click('#voices [data-nudge="0,-1"]')
    assert path(page) == 'C C+ C6 Am/B'
    page.hover('#here-name')   # off the arrow, whose hover previews the next move
    assert 'bass C ↓ B' in page.inner_text('#lead')


def test_slipping_to_a_chord_by_half_steps(page):
    page.click(group('Slip there by half steps') + ':has(b:text-is("Am"))')
    assert path(page) == 'C C+ Am'
    stop(page)


def test_home_and_pull_walks_the_eight_note_scale(page):
    page.click(group('Home and pull') + ':has(b:text-is("C6"))')
    for _ in range(3):
        page.click(group('Home and pull') + ':has(i:text("walk up"))')
    assert path(page) == 'C C6 D°7 C6/E F°7'
    page.click('#scale8')
    assert page.get_attribute('#scale8', 'aria-pressed') == 'true'
    assert page.locator('#keys circle.f-rest').count() > 8


def test_a_diminished_chord_has_four_homes_and_any_can_become_the_key(page):
    page.click(group('Home and pull') + ':has(b:text-is("C6"))')
    page.click(group('Home and pull') + ':has(i:text("walk up"))')
    homes = page.locator(group('Home and pull') + ' b').all_inner_texts()
    assert homes[:4] == ['C6', 'Am', 'E♭6', 'F♯6']
    page.click('#lens-tabs [data-lens=wheel]')
    assert 'four homes' in page.text_content('#map')
    page.click(group('Home and pull') + ':has(b:text-is("E♭6"))')
    page.click('#rehome')
    assert page.eval_on_selector('#key', 'e => e.selectedOptions[0].textContent') == 'E♭'
    assert page.inner_text('#here-job').lower() == 'home'


def test_changing_key_moves_the_whole_path(page):
    page.click('#seeds [data-seed="5"]')
    stop(page)
    assert path(page) == 'C A7 Dm G'
    page.select_option('#key', '5')
    assert path(page) == 'F D7 Gm C'
    page.click('#rich-on')
    assert path(page) == 'Fmaj7 D7 Gm7 C7'


def test_light_and_dark(page):
    background = "getComputedStyle(document.body).backgroundColor"
    assert page.get_attribute('html', 'data-scheme') == 'light'
    page.click('#theme [data-set-theme=dark]')
    assert page.get_attribute('html', 'data-scheme') == 'dark'
    assert page.evaluate(background) == 'rgb(30, 32, 39)'
    page.click('#theme [data-set-theme=light]')
    assert page.evaluate(background) == 'rgb(255, 255, 255)'


def test_the_piano_is_playable_and_uses_the_recordings(page):
    page.evaluate("""() => {
      window.voicesStarted = 0;
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...a) { window.voicesStarted++; return start.apply(this, a); };
    }""")
    before = path(page)
    box = page.locator('#keys [data-m="64"]').bounding_box()
    page.mouse.click(box['x'] + box['width'] / 2, box['y'] + box['height'] - 6)
    page.wait_for_function('window.chordLandscape.Snd.ready()')
    page.wait_for_function('window.voicesStarted >= 1')
    assert path(page) == before


def test_the_drills_set_themselves_up(page):
    for name, start in (('walk', r'^C6 D°7 C6/E'), ('slide', r'^Cmaj9 C7♭9 Fmaj9'), ('warmup', r'^Cmaj7 C6 ')):
        page.evaluate(f'window.chordLandscape.DRILLS.{name}()')
        stop(page)
        assert re.match(start, path(page)), (name, path(page))


def test_a_phone_screen_has_no_sideways_scroll(page):
    page.set_viewport_size({'width': 390, 'height': 844})
    page.click('#seeds [data-seed="2"]')
    stop(page)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
    assert page.is_visible('#keys')
    assert page.is_visible('#voices')
