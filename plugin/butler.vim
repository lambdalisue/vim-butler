if exists('g:loaded_butler')
  finish
endif
let g:loaded_butler = 1

command! -bar Butler call butler#show(<q-mods>)

" Configurable settings
function! s:define(name, default) abort
  let g:{a:name} = get(g:, a:name, a:default)
endfunction
call s:define('butler_openai_model', 'text-davinci-003')
call s:define('butler_openai_max_tokens', 2048)
call s:define('butler_openai_temperature', 0.4)
