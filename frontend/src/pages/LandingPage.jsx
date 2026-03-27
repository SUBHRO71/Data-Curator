import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Shield, Zap, ArrowRight, BrainCircuit } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <header className="absolute inset-x-0 top-0 z-50">
                <nav className="flex items-center justify-between p-6 lg:px-8">
                    <div className="flex lg:flex-1 items-center gap-x-2 text-indigo-600 font-bold text-xl">
                        <BrainCircuit className="w-8 h-8" />
                        <span>Curator AI</span>
                    </div>
                    <div className="flex flex-1 justify-end">
                        <Link to="/auth" className="text-sm font-semibold leading-6 text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors">
                            Log in <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="isolate">
                {/* Hero Section */}
                <div className="relative pt-14">
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                    </div>
                    
                    <div className="py-24 sm:py-32 lg:pb-40 text-center mx-auto max-w-4xl px-6">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl drop-shadow-sm">
                            Prepare ML data with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Enterprise Safety</span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto font-medium">
                            Automate metadata tagging, run deep PII compliance checks, and unify your datasets in seconds with our advanced AI ingestion pipeline.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link to="/auth" className="rounded-full bg-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all flex items-center group">
                                Get Started
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features" className="text-sm font-semibold leading-6 text-slate-900 flex items-center group">
                                Learn more <span className="group-hover:translate-x-1 transition-transform inline-block ml-1">→</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="py-24 sm:py-32 bg-slate-50 border-t border-slate-100">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center shrink-0">
                            <h2 className="text-base font-semibold leading-7 text-indigo-600">Powerful Engine</h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to ship datasets</p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                                <div className="flex flex-col rounded-2xl bg-white p-8 shadow-sm border border-slate-100 ring-1 ring-slate-200/50 hover:shadow-md transition-shadow">
                                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                                        <Database className="h-8 w-8 flex-none text-indigo-600 bg-indigo-50 p-1.5 rounded-lg" />
                                        Data Unification
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                                        <p className="flex-auto">Ingest Image, Text, Audio, and Video files. Automatically normalize sizes, encodings, and layouts into standardized datasets exportable to JSON, CSV, or TFRecord.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col rounded-2xl bg-white p-8 shadow-sm border border-slate-100 ring-1 ring-slate-200/50 hover:shadow-md transition-shadow">
                                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                                        <Zap className="h-8 w-8 flex-none text-amber-500 bg-amber-50 p-1.5 rounded-lg" />
                                        AI Metadata Tagging
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                                        <p className="flex-auto">Leverage computer vision and NLP models to automatically annotate files with intelligent bounding box tags, language detections, and OCR extraction.</p>
                                    </dd>
                                </div>
                                <div className="flex flex-col rounded-2xl bg-white p-8 shadow-sm border border-slate-100 ring-1 ring-slate-200/50 hover:shadow-md transition-shadow">
                                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                                        <Shield className="h-8 w-8 flex-none text-emerald-600 bg-emerald-50 p-1.5 rounded-lg" />
                                        Compliance Engine
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                                        <p className="flex-auto">Bulletproof checks against PII, hate speech, and demographic bias. Avoid GDPR and HIPAA liabilities with our automated redaction and scoring workflows.</p>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
