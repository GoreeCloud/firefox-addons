# GoreeCloud ChatGPT Enhancer — User Manual

## Open the command center

On `chatgpt.com`, press **Alt+Shift+G** or select the floating **G** button.

Type in the command search box to filter available actions. Press Enter to run the first matching command or select any command directly.

Press Escape to close the command center.

## Return to the prompt

Press **Alt+Shift+P** to focus the current ChatGPT prompt composer.

## Search a conversation

Open the command center and choose **Search this conversation**. Enter text to search messages currently loaded in the page. Select a result to jump to it.

Search is local and does not create a persistent index.

## Use the outline

Choose **Open conversation outline** to see the user prompts currently loaded in the page. Select any prompt to jump to it.

## Copy or export

- **Copy last response** copies the last currently loaded assistant response.
- **Copy conversation as Markdown** copies the loaded user/assistant message sequence as Markdown.
- **Download conversation as Markdown** creates a local `.md` file.

Export includes the current conversation URL. Protect exported files as you would protect the conversation itself.

## Use prompt snippets

Open Firefox's ChatGPT Enhancer Settings page from the toolbar popup. Add a snippet name and reusable prompt text.

On ChatGPT, open the command center, choose **Insert saved prompt snippet**, and select a snippet. The extension adds it to the current composer without submitting it.

## Presentation controls

The toolbar popup provides fast toggles for:

- wide conversation;
- compact spacing;
- focus mode;
- code wrapping;
- floating launcher;
- draft recovery.

The full Settings page also provides content-width and text-scale controls.

## Draft recovery

Draft recovery is off by default.

To use it:

1. Enable **Draft recovery** in the popup or Settings.
2. Type in the ChatGPT composer as normal.
3. If you need to recover the saved draft, open the command center and choose **Restore saved draft**.
4. Use **Clear all saved drafts** in Settings when you no longer want locally retained drafts.

The extension never submits a restored draft automatically.

## Troubleshooting

If an enhancement stops working after a ChatGPT interface update:

1. Reload the ChatGPT tab.
2. Confirm the extension remains enabled.
3. Confirm the feature setting is enabled.
4. Disable focus mode if page navigation appears missing.
5. Temporarily reload the add-on from `about:debugging` during development.

A ChatGPT interface change may require a source update. The extension should not widen permissions as a workaround for changed page structure.
