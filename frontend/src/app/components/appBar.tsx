'use client'

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Image from 'next/image';

function ResponsiveAppBar() {

  return (
    <AppBar position="static" sx={{ paddingLeft: 1, backgroundColor: '#292828' }}>
        <Toolbar disableGutters sx={{ justifyContent: 'flex-start', padding: 0 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
                <Image
                    className="dark:invert"
                    src="/weathernest.png"
                    alt="Next.js logo"
                    width={70}
                    height={70}
                    priority
                />
            </a>
        </Toolbar>
    </AppBar>

  );
}
export default ResponsiveAppBar;
