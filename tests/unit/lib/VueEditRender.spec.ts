import Consola from 'consola';
import { mount } from '@vue/test-utils'
import { Hton } from '@/lib/hton'
import AppHeader from './AppHeader.vue'
import VueEditRender from '@/lib/VueEditRender.vue'

describe('VueEditRender.vue', () => {
  it('renders a piece of HTON into HTML', () => {
    const hton = [
      'AppHeader',
      [
        ['#t', 'This is the header']
      ],
      { class: 'theme-dark' },
      {
        subtitle: [
          [
            'strong',
            [
              ['#t', 'Some subtitle']
            ]
          ]
        ]
      }
    ] as Hton;

    const wrapper = mount(VueEditRender, {
      propsData: {
        hton,
        components: { AppHeader }
      }
    });

    expect(wrapper.element.tagName).toMatch('HEADER');
    expect(wrapper.element.children.length).toBe(2);
    expect(wrapper.element.classList.contains('theme-dark')).toBe(true);

    expect(wrapper.get('h1')).toBeTruthy();
    expect(wrapper.get('h1').element.children.length).toBe(0);
    expect(wrapper.get('h1').text()).toMatch('This is the header');

    expect(wrapper.get('p')).toBeTruthy();
    expect(wrapper.get('p').element.children.length).toBe(1);

    expect(wrapper.get('p').get('strong')).toBeTruthy();
    expect(wrapper.get('p').get('strong').element.children.length).toBe(0);
    expect(wrapper.get('p').get('strong').text()).toMatch('Some subtitle');
  })
})
