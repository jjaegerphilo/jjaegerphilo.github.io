# -*- coding: utf-8 -*-
"""
Created on Fri Jul 24 12:56:46 2015

@author: Jens
"""

# -*- coding: utf-8 -*-
"""
Created on Fri Jun 19 15:32:16 2015

@author: Jens
"""

import os
from numpy import *
from numpy.linalg import norm
from random import uniform
from numpy.fft import *
from scipy.optimize import curve_fit
from matplotlib.pyplot import *


hbar = 6
m = 1

def construct_initial(N,interval,p0,startposition):

    a,b = interval
    interval = linspace(a,b,N)
    x0 = startposition
    
    #sigma = hbar/(p0*sqrt(2)) #Assume that uncertainty \Delta p0 is proportional to p0
    sigma = hbar/(1.5*sqrt(2))    
    
    g = lambda x: exp(1j*p0*(x-x0))*exp(-(x-x0)**2/(2*sigma**2))
    state = array([g(x) for x in interval])
    
    state = state/(norm(state) * sqrt(abs(b-a)/N))

    return state, interval




def construct_delta(deltaid,delta_param,a,b,loc=0,tol=1e-7):

    if(deltaid == "WKB"):
        alpha = float(delta_param)            
        delta = lambda x: deltamax*alpha**2 / (1.-alpha**2/(b+alpha)**2) * (1./alpha**2 - 1./(x+alpha)**2)
    elif(deltaid == '$\delta_{max} [const]$'):
        deltamax = float(delta_param)
        delta = lambda x: deltamax #constant)
    elif(deltaid == "$e^{-1/x}$"):
        tol = 1e-7
        deltamax = float(delta_param)
        power = 1
        delta = lambda x: deltamax * exp_min1overx(x,power,tol) * exp(1./b)
    elif(deltaid == "$e^{-1/x^2}$"):
        tol = 1e-7
        deltamax = float(delta_param)
        power = 2
        delta = lambda x: deltamax * exp_min1overx(x,power,tol) * exp(1./b**power)
    return lambda x: delta(x)*theta(x-loc)


def construct_measops(N,delta,a,b):
    
    x = linspace(a,b,N)

    deltax = nan_to_num(delta(x))
    deltax[ where(deltax < 0) ] = 0.0
    deltax[ where(deltax > 1) ] = 1.0
    
    pi0 = sqrt(1.-deltax)
    pi1 = sqrt(deltax)
    
    return pi0, pi1


def intevol(psi,deltaT,interval):
    #free evolution
    
    a,b = interval
    N = size(psi)

    lap = hstack((arange(0, N/2.,), -1.*arange(N/2., 0 ,-1)))**2 #exp(-iHt) in momentum space
    #lap = 0.5 * lap * 4*pi**2 / abs(a-b)**2
    lap = hbar**2/(2.*m) * lap / abs(a-b)**2
    evolop = exp(-1j*lap*deltaT)
    
    return ifft(evolop*fft(psi))


def plot_wave(x, v, k, deltaT, delta, directory, w, ymin=-5, ymax=5):

    fig = figure()
    ax = fig.gca()
    ax.plot(x, real(v), "b-", label=r"$\Re u(t)$")
    ax.plot(x, imag(v), "g-", label=r"$\Im u(t)$")
    ax.plot(x, abs(v), "r-", label=r"$|u(t)|$")
    ax.plot(x, real(w), "b-", alpha=0.3)#,label=r"$\Re u(t)$")
    ax.plot(x, imag(w), "g-", alpha=0.3)#,label=r"$\Im u(t)$")
    ax.plot(x, abs(w), "r-", alpha=0.3)#,label=r"$|u(t)|$")
    ax.legend(loc='lower right')
    ax.set_xlabel(r"$x$")
    ax.set_title("Time $t$=%.5f (Time Step #%d, Step Size $\Delta t$ = %.5f)" %(k*deltaT,k,deltaT))
    ax.set_xlim(x.min(), x.max())
    ax.set_ylim(ymin, ymax)
    
    deltamin = ymin
    deltamax = delta(x)
    
    ax.fill_between(x, deltamin, deltamax, color="k", alpha=0.2)
    
    grid(True)
    
    savefig(''.join((directory,"/solution_at_timestep %04d.png")) % k)

    close(fig)


def plot_prob_arrival(prob,prob_undist,sigma_d,sigma_u,totaldetectionprob,directory,exp_nr=0,p0=0,a=0):

    k = arange(size(prob))
    
    fig = figure(figsize = (7,6))
    ax = fig.gca()
    ax.plot(k,prob,"r-")
    
    ax.plot(k,prob_undist,"g--",label="prob_undist")

    ax.set_title("Probability to detect arrival of particle @ momentary time step \n and prob_undist of undisturbed wave packet at $x_0$")
    ax.set_xlabel("Time Step")
    ax.set_ylabel("Probability")
    ax.set_ylim(0)
    grid(True)
    legend(loc='best')
            
    fig.text(0.05,0.02,"Total det.prob.: %.4f ; Rat of StdDev: %.4f ; $p_0 = %.4f$ ; $a = %.4f$"%(totaldetectionprob,abs(sigma_d/sigma_u),p0,a))  
        
    if not os.path.exists(directory): #create directory
        os.makedirs(directory)
        
    fig.savefig(''.join((directory,"detection_probability%d.png"%(exp_nr))))
    
    close()


def plot_(TDP,WR,deltaids,delta_params,P0,directory,plot_width_energy=True):
    
    fig = figure()
    ax = fig.gca()

    ##shape(TDP)=[deltaids,delta_params,P0]    
    wr_p0 = zeros((shape(TDP)[0],shape(TDP)[2]))    
    
    for i in xrange(shape(TDP)[0]):
        for k in xrange(shape(TDP)[2]):
            decprob = TDP[i,:,k]
            wr = WR[i,:,k]
            ax.plot(decprob,wr,'-x',label=deltaids[i]+", $p_0 = %.1f$"%P0[k])
#            for l,pw in enumerate(zip(decprob,wr)):            
#                ax.annotate("$a = %.3f$" %(float(delta_params[l])), xy = pw, textcoords='offset points')            
            #each point corresponds to different values of a
            if(plot_width_energy==True):
                decprob = decprob[::-1]
                wr = wr[::-1]
                decprob_fix = 0.99
                ind = argmin(abs(decprob-decprob_fix))
                if(decprob[ind]>decprob_fix and ind>0):
                    ind -= 1
                coeff = polyfit(decprob[ind:ind+2],wr[ind:ind+2],1)
                wr_p0[i,k] = polyval(coeff,[decprob_fix]) #list of width ratio (vs initial momentum) for current deltaid
                #ax.plot(linspace(decprob[ind],decprob[ind+1],5),polyval(coeff,linspace(decprob[ind],decprob[ind+1],5)),'-x')

    ax.set_title("$\Delta t$ vs Total Detection Probability")
    ax.set_xlabel("Total Detection Probability")
    ax.set_ylabel("$\Delta t$")
    ax.set_xlim(0.97,1)
    ax.set_ylim(1,1.07)
    #ax.legend(loc='best')
    ax.grid(True)
    
    fig.savefig(directory+"_"+str(P0[0])+"_"+str(P0[-1])+".png")
    
    close()
    
    
    if(plot_width_energy==True):
        fig = figure()
        ax = fig.gca()
        
        E_inv = 1./array(P0)**2

        for i in xrange(shape(TDP)[0]):
            ax.plot(E_inv,wr_p0[i,:],'-x')
#        for k,Ew in enumerate(zip(E,wr)):
#            ax.annotate("TDP = %.2f"%(tdp[k]), xy = Ew, textcoords='offset points')
        ax.set_title("$\Delta t = \sigma_d/\sigma_{u}$ vs $1/E_{kin}$\n at fixed detection probability $DP = %.2f$"%(decprob_fix))
        ax.set_xlabel("$1/E_{kin}$")
        ax.set_ylabel("$\Delta t$")
        ax.grid(True)
        
        fig.savefig(directory+"_wr_energy_"+str(P0[0])+"_"+str(P0[-1])+".png")
        
        close()

def exp_min1overx(x,power,tol):
    
    res = zeros_like(x)
    
    if(size(x)==1):
        if(x>tol):
            return exp(-1./(x**power))
        else:
            return 0.
        
    for i,xx in enumerate(x):
        if(xx>tol):
            res[i] = exp(-1./(xx**power))
        else:
            pass
        
    return res

def theta(x): #Heaviside Step function
    return 0.5 * (sign(x) + 1)
