import { api, appName, invoke } from '../../../api/api.js'
import { confirmModal } from './modal.jsx'

const {
  ui: {
    openModal,
    TextBox,
    Text
  },
  solid: {
    createSignal,
  }
} = shelter

export const installThemeModal = async () => {
  const [link, setLink] = createSignal<string>('')
  const [status, setStatus] = createSignal<string>('')

  openModal((props) => confirmModal({
    header: 'Install Theme',
    body: (
      <div>
        <TextBox
          value={link()}
          onInput={(v) => setLink(v)}
          placeholder={'https://raw.githubusercontent.com/.../theme.css'}
        />

        <div style={{
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          height: '24px',
        }}>
          <Text>{status()}</Text>
        </div>
      </div>
    ),
    confirmText: 'Install',
    type: 'neutral',
    onConfirm: () => {
      installAndLoad(link(), setStatus).catch(e => {
        setStatus(e)
      }).then(props.close)
    },
    onCancel: props.close,
  }))
}

// FIXME remove this 
export const deprecated_loadTheme = async (theme: string) => {
  // Get the Dorion theme style tag, replace the contents
  const themeTag = document.getElementById(`${appName.toLowerCase()}-theme`) as HTMLStyleElement

  if (theme === 'none') return themeTag.innerText = ''

  const themeContents = await invoke('get_theme', {
    name: theme
  })

  // Localize
  const localized = await invoke('localize_imports', {
    css: themeContents,
    name: theme
  })

  console.log('Got the localized theme!')

  // Internal Dorion function
  const contents = api.util.cssSanitize(localized)

  console.log('Sanitized!')

  themeTag.innerHTML = contents
}

export const reloadThemes = async () => {
  // Get the Dorion theme style tag, replace the contents
  const themeTag = document.getElementById(`${appName.toLowerCase()}-theme`) as HTMLStyleElement

  // Get the initial theme
  const themeContents = await invoke('get_themes').catch(e => console.error(e))

  // Create a "name" for the "theme" (or combo) based on the retrieved enabled theme list
  const themeNames = await invoke('get_enabled_themes').catch(e => console.error(e)) || []
  // Gotta adhere to filename length restrictions
  const themeName = themeNames.join('').substring(0, 254)

  if (themeName === '') {
    themeTag.innerHTML = ''
    return
  }

  const localized = await invoke('localize_imports', {
    css: themeContents,
    name: themeName
  })

  // Internal Dorion function
  const contents = api.util.cssSanitize(localized)

  themeTag.innerHTML = contents
}

export const installAndLoad = async (link: string, statusUpdater: (string) => void) => {
  statusUpdater('Fetching...')

  const themeName = await invoke('theme_from_link', {
    link
  })

  statusUpdater(`Applying ${themeName} ...`)

  // Save the theme to the config
  const config = JSON.parse(await invoke('read_config_file'))

  // FIXME Cover both the old and new way of doing things
  config.theme = themeName
  config?.themes?.push(themeName) 

  statusUpdater('Saving...')

  await invoke('write_config_file', {
    contents: JSON.stringify(config)
  })

  // Get the Dorion theme style tag, replace the contents
  await reloadThemes()

  statusUpdater('Done!')
}