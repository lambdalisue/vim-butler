function! butler#show(mods) abort
  let l:suffix = sha256(localtime())
  execute printf('%s edit butler://%s', a:mods, l:suffix)
endfunction

function! s:edit() abort
  setlocal filetype=markdown
  setlocal nomodeline noswapfile nobackup
  setlocal nofoldenable
  setlocal buftype=prompt bufhidden=hide

  if exists('b:butler_cached')
    call setline(1, b:butler_cached)
  endif

  let l:bufnr = bufnr()
  call prompt_setcallback(l:bufnr, funcref('s:prompt'))
  call prompt_setprompt(l:bufnr, '')
  startinsert
endfunction

function! s:prompt(text) abort
  if a:text ==# 'exit' || a:text ==# 'quit'
    stopinsert
    close
  elseif !empty(a:text)
    stopinsert
    call s:submit()
  else
    call deletebufline(bufnr(), line('$'))
  endif
endfunction

function! s:submit() abort
  if getline('$') !=# ''
    call append('$', '')
  endif
  let l:winid = win_getid()
  let l:bufnr = bufnr()
  let l:callback = denops#callback#register(
        \ { w, b -> s:post_submit(w, b) },
        \ { 'once': v:true },
        \)
  call denops#plugin#wait_async(
        \ 'butler',
        \ { -> denops#notify('butler', 'command', [l:winid, l:bufnr, l:callback]) },
        \)
endfunction

function! s:post_submit(winid, bufnr) abort
  call setbufvar(a:bufnr, '&modified', 0)
  call setbufvar(a:bufnr, 'butler_cached', getbufline(a:bufnr, 1, '$'))
  call win_execute(a:winid, 'startinsert')
endfunction

augroup butler_autoload_butler
  autocmd!
  autocmd BufReadCmd butler://* ++nested call s:edit()
augroup END

highlight default link ButlerResponseLine CursorLine
sign define butlerResponseLine linehl=ButlerResponseLine
